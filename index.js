// index.js
import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';

// ipfs-car v3 (streams API)
import { createFileEncoderStream, CAREncoderStream } from 'ipfs-car';

// Node web streams + Blob (ensure cross-version support)
import { ReadableStream, WritableStream } from 'node:stream/web';
import { Blob } from 'buffer';

// For computing CAR CID (multicodec 0x0202)
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '25mb' }));

const {
  PORT = 5055,
  STORACHA_BRIDGE_URL = 'https://up.storacha.network/bridge',
  STORACHA_X_AUTH_SECRET,
  STORACHA_AUTH,
  SPACE_DID,
  GATEWAY_BASE = 'https://w3s.link/ipfs/',
} = process.env;

function bridgeHeaders() {
  if (!STORACHA_X_AUTH_SECRET || !STORACHA_AUTH || !SPACE_DID) {
    throw new Error('Missing STORACHA_X_AUTH_SECRET, STORACHA_AUTH, or SPACE_DID in .env');
  }
  return {
    'Content-Type': 'application/json',
    'X-Auth-Secret': STORACHA_X_AUTH_SECRET,
    'Authorization': STORACHA_AUTH, // no "Bearer"
  };
}

app.get('/health', (_req, res) => res.json({ ok: true }));

/** Build a CAR from raw bytes and return { rootCid, carBytes } */
async function bytesToCar(bytes /* Buffer | Uint8Array */) {
  // 1) Turn bytes into Blob
  const file = new Blob([bytes], { type: 'application/octet-stream' });

  // 2) Create DAG blocks and capture them to get the root CID
  const blocks = [];
  await createFileEncoderStream(file).pipeTo(
    new WritableStream({
      write: (b) => blocks.push(b),
    })
  );
  const rootCID = blocks.at(-1).cid;

  // 3) Re-encode blocks into a CAR with root header
  const blockStream = new ReadableStream({
    pull(controller) {
      if (blocks.length) controller.enqueue(blocks.shift());
      else controller.close();
    },
  });

  const carChunks = [];
  await blockStream
    .pipeThrough(new CAREncoderStream([rootCID]))
    .pipeTo(new WritableStream({ write: (c) => carChunks.push(c) }));

  const carBytes = Buffer.concat(carChunks.map((c) => Buffer.from(c)));
  return { rootCid: rootCID.toString(), carBytes };
}

/** Compute CAR CID (multicodec 0x0202, hash = sha2-256) → "bag..." */
const CAR_CODE = 0x0202;
async function carCid(carBytes /* Uint8Array|Buffer */) {
  const mh = await sha256.digest(carBytes);
  return CID.createV1(CAR_CODE, mh).toString(); // e.g., "bagbaiera..."
}

app.post('/storacha/upload', async (req, res) => {
  try {
    const { fileName, contentBase64 } = req.body || {};
    if (!fileName || !contentBase64) {
      return res.status(400).json({ ok: false, error: 'fileName and contentBase64 are required' });
    }

    const bytes = Buffer.from(contentBase64, 'base64');

    // Pack to CAR (root = bafy..., CAR CID = bag...)
    const { rootCid, carBytes } = await bytesToCar(bytes);
    const size = carBytes.length;
    const shardCid = await carCid(carBytes);

    console.log('[upload] rootCid:', rootCid);
    console.log('[upload] shardCid (CAR CID):', shardCid);
    console.log('[upload] size(bytes):', size);

    // 1) store/add → signed PUT URL + headers
    const tasksStore = {
      tasks: [['store/add', SPACE_DID, { link: { '/': shardCid }, size }]],
    };
    const storeResp = await axios.post(STORACHA_BRIDGE_URL, tasksStore, { headers: bridgeHeaders() });

    console.log('[store/add] response:', JSON.stringify(storeResp.data, null, 2));

    // after storeResp
    const storeTask = (storeResp.data?.results || [])[0];
    const putUrl = storeTask?.out?.ok?.url;
    const putHeaders = storeTask?.out?.ok?.headers || {};

    if (!putUrl) {
      console.error('[store/add] no putUrl; full response:', JSON.stringify(storeResp.data, null, 2));
      return res.status(502).json({
        ok: false,
        error: 'Bridge did not return a PUT URL',
        bridge: storeResp.data   // <— include raw bridge response so we can read the reason
      });
    }

    if (!putUrl) {
      return res
        .status(502)
        .json({ ok: false, error: 'Bridge did not return a PUT URL (check link/size/caps/tokens)' });
    }

    // 2) PUT CAR bytes
    await axios.put(putUrl, carBytes, { headers: putHeaders, maxBodyLength: Infinity });
    console.log('[PUT] uploaded CAR to signed URL');

    // 3) upload/add → register root + shards
    const tasksUpload = {
      tasks: [['upload/add', SPACE_DID, { root: { '/': rootCid }, shards: [{ '/': shardCid }] }]],
    };
    const upResp = await axios.post(STORACHA_BRIDGE_URL, tasksUpload, { headers: bridgeHeaders() });
    console.log('[upload/add] response:', JSON.stringify(upResp.data, null, 2));

    return res.json({
      ok: true,
      rootCid,
      gatewayUrl: `${GATEWAY_BASE}${rootCid}`,
    });
  } catch (e) {
    const err = e?.response?.data || e?.message || e;
    console.error('[error]', err);
    return res.status(500).json({ ok: false, error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Storacha bridge backend listening on :${PORT}`);
});


app.get('/storacha/debug/list', async (_req, res) => {
  try {
    const payload = { tasks: [['upload/list', SPACE_DID, {}]] };
    const r = await axios.post(STORACHA_BRIDGE_URL, payload, { headers: bridgeHeaders() });
    return res.json({ ok: true, bridge: r.data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
});
