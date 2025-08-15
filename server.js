
// Enhanced server.js with NFT minting capabilities
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { create } from '@storacha/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import PDFDocument from 'pdfkit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Initialize Storacha client
let storachaClient = null;
let currentSpace = null;

// Initialize Web3 provider (for NFT minting)
let provider = null;
let wallet = null;
let nftContract = null;

async function initializeStoracha() {
  try {
    console.log('🚀 Initializing Storacha client...');

    storachaClient = await create();

    console.log('📧 Logging in with email...');
    const account = await storachaClient.login(process.env.STORACHA_EMAIL);
    console.log('✅ Login successful');

    console.log('💳 Waiting for payment plan...');
    await account.plan.wait();
    console.log('✅ Payment plan confirmed');

    try {
      currentSpace = await storachaClient.createSpace("birth-certificate-space", { account });
      console.log('🌌 Created new space:', currentSpace.did());
    } catch (error) {
      if (error.message.includes('space already exists')) {
        console.log('🌌 Using existing space');
      } else {
        throw error;
      }
    }

    console.log('✅ Storacha initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize Storacha:', error);
    process.exit(1);
  }
}

async function initializeWeb3() {
  try {
    console.log('🔗 Initializing Web3...');

    // Initialize provider (you can use different networks)
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID');

    // Initialize wallet
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // NFT Contract ABI (simplified)
    const nftABI = [
      "function mint(address to, string memory tokenURI) public returns (uint256)",
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
      "function balanceOf(address owner) public view returns (uint256)",
      "function ownerOf(uint256 tokenId) public view returns (address)"
    ];

    // Initialize contract (deploy your own NFT contract or use existing)
    nftContract = new ethers.Contract(
      process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      nftABI,
      wallet
    );

    console.log('✅ Web3 initialized successfully');
    console.log('📝 Wallet address:', wallet.address);

  } catch (error) {
    console.error('❌ Failed to initialize Web3:', error);
    // Don't exit here, NFT minting is optional
  }
}

// Generate PDF Birth Certificate
// async function generateBirthCertificatePDF(birthData) {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ margin: 50 });
//       const chunks = [];

//       doc.on('data', chunk => chunks.push(chunk));
//       doc.on('end', () => resolve(Buffer.concat(chunks)));

//       // Header
//       doc.fontSize(24).font('Helvetica-Bold')
//         .text('BIRTH CERTIFICATE', { align: 'center' });

//       doc.moveDown(2);

//       // Certificate details
//       doc.fontSize(12).font('Helvetica');

//       const details = [
//         ['Full Name:', `${birthData.firstName} ${birthData.middleName || ''} ${birthData.lastName}`],
//         ['Date of Birth:', birthData.dateOfBirth],
//         ['Place of Birth:', birthData.placeOfBirth],
//         ['Mother\'s Name:', `${birthData.motherFirstName} ${birthData.motherLastName}`],
//         ['Father\'s Name:', `${birthData.fatherFirstName} ${birthData.fatherLastName}`],
//         ['Mother\'s NIN:', birthData.motherNIN],
//         ['Father\'s NIN:', birthData.fatherNIN],
//         ['Registration Date:', new Date().toLocaleDateString()],
//         ['Certificate ID:', birthData.certificateId || 'BC-' + Date.now()]
//       ];

//       details.forEach(([label, value]) => {
//         if (value) {
//           doc.text(`${label.padEnd(20)} ${value}`, { continued: false });
//           doc.moveDown(0.5);
//         }
//       });

//       doc.moveDown(2);

//       // Footer
//       doc.fontSize(10)
//         .text('This is a digitally generated birth certificate.', { align: 'center' })
//         .text('Stored on IPFS and blockchain for authenticity.', { align: 'center' });

//       if (birthData.ipfsCid) {
//         doc.moveDown()
//           .text(`IPFS CID: ${birthData.ipfsCid}`, { align: 'center' });
//       }

//       doc.end();

//     } catch (error) {
//       reject(error);
//     }
//   });
// }
// Enhanced PDF Birth Certificate Generator with Professional Design
// Replace the generateBirthCertificatePDF function in your server.js

async function generateBirthCertificatePDF(birthData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 0,
        size: 'A4',
        layout: 'portrait'
      });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Page dimensions
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      
      // Colors
      const primaryColor = '#1a365d';      // Dark blue
      const accentColor = '#2d3748';       // Dark gray
      const goldColor = '#d4af37';         // Gold
      const lightGray = '#f7fafc';         // Light gray background
      const textColor = '#2d3748';         // Text color

      // Background
      doc.rect(0, 0, pageWidth, pageHeight)
         .fill(lightGray);

      // Header background with gradient effect
      doc.rect(0, 0, pageWidth, 120)
         .fill(primaryColor);

      // Decorative border
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
         .strokeColor(goldColor)
         .lineWidth(3)
         .stroke();

      doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
         .strokeColor(goldColor)
         .lineWidth(1)
         .stroke();

      // Official seal/emblem (decorative circle)
      const sealX = pageWidth / 2;
      const sealY = 80;
      
      doc.circle(sealX, sealY, 35)
         .strokeColor(goldColor)
         .lineWidth(3)
         .stroke();
         
      doc.circle(sealX, sealY, 25)
         .strokeColor(goldColor)
         .lineWidth(1)
         .stroke();

      // Government text in seal
      doc.fillColor('white')
         .fontSize(8)
         .font('Helvetica-Bold')
         .text('OFFICIAL', sealX - 20, sealY - 15, { width: 40, align: 'center' })
         .text('SEAL', sealX - 20, sealY - 5, { width: 40, align: 'center' });

      // Main Title
      doc.fillColor('white')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('BIRTH CERTIFICATE', 0, 140, {
           width: pageWidth,
           align: 'center'
         });

      // Subtitle
      doc.fontSize(14)
         .font('Helvetica')
         .text('CERTIFICATE OF LIVE BIRTH', 0, 175, {
           width: pageWidth,
           align: 'center'
         });

      // Certificate number (top right)
      doc.fillColor(accentColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(`Certificate No: ${birthData.certificateId || 'BC-' + Date.now()}`, 
               pageWidth - 200, 200, { width: 150, align: 'right' });

      // Main content area background
      const contentY = 230;
      doc.rect(60, contentY, pageWidth - 120, 400)
         .fill('white')
         .strokeColor('#e2e8f0')
         .lineWidth(1)
         .stroke();

      // Content header
      doc.fillColor(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('PERSONAL INFORMATION', 0, contentY + 30, {
           width: pageWidth,
           align: 'center'
         });

      // Helper function to add field
      let currentY = contentY + 70;
      
      function addField(label, value, isFullWidth = false) {
        const leftMargin = 80;
        const rightMargin = pageWidth - 80;
        const fieldHeight = 35;
        
        // Field background
        doc.rect(leftMargin, currentY, rightMargin - leftMargin, fieldHeight)
           .fill('#f8f9fa')
           .strokeColor('#e2e8f0')
           .lineWidth(0.5)
           .stroke();

        // Label
        doc.fillColor(accentColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(label, leftMargin + 15, currentY + 8);

        // Value
        doc.fillColor(textColor)
           .fontSize(12)
           .font('Helvetica')
           .text(value || 'Not Provided', leftMargin + 15, currentY + 20);

        currentY += fieldHeight + 5;
      }

      // Personal Information Fields
      const fullName = `${birthData.firstName} ${birthData.middleName || ''} ${birthData.lastName}`.trim();
      
      addField('FULL NAME', fullName);
      addField('DATE OF BIRTH', birthData.dateOfBirth);
      addField('PLACE OF BIRTH', birthData.placeOfBirth);

      // Parents section
      currentY += 20;
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('PARENTS INFORMATION', 0, currentY, {
           width: pageWidth,
           align: 'center'
         });

      currentY += 25;

      // Parent fields in two columns
      function addParentFields(leftLabel, leftValue, rightLabel, rightValue) {
        const leftMargin = 80;
        const columnWidth = (pageWidth - 160) / 2 - 10;
        const fieldHeight = 35;
        
        // Left field
        doc.rect(leftMargin, currentY, columnWidth, fieldHeight)
           .fill('#f8f9fa')
           .strokeColor('#e2e8f0')
           .lineWidth(0.5)
           .stroke();

        doc.fillColor(accentColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(leftLabel, leftMargin + 10, currentY + 8);

        doc.fillColor(textColor)
           .fontSize(12)
           .font('Helvetica')
           .text(leftValue || 'Not Provided', leftMargin + 10, currentY + 20);

        // Right field
        const rightMargin = leftMargin + columnWidth + 20;
        doc.rect(rightMargin, currentY, columnWidth, fieldHeight)
           .fill('#f8f9fa')
           .strokeColor('#e2e8f0')
           .lineWidth(0.5)
           .stroke();

        doc.fillColor(accentColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(rightLabel, rightMargin + 10, currentY + 8);

        doc.fillColor(textColor)
           .fontSize(12)
           .font('Helvetica')
           .text(rightValue || 'Not Provided', rightMargin + 10, currentY + 20);

        currentY += fieldHeight + 5;
      }

      const motherName = `${birthData.motherFirstName || ''} ${birthData.motherLastName || ''}`.trim();
      const fatherName = `${birthData.fatherFirstName || ''} ${birthData.fatherLastName || ''}`.trim();

      addParentFields("MOTHER'S NAME", motherName, "FATHER'S NAME", fatherName);
      addParentFields("MOTHER'S NIN", birthData.motherNIN, "FATHER'S NIN", birthData.fatherNIN);

      // Registration details
      currentY += 20;
      addField('REGISTRATION DATE', new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));

      // Blockchain information
      if (birthData.ipfsCid || birthData.supportingDocumentCid) {
        currentY += 20;
        doc.fillColor(primaryColor)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('BLOCKCHAIN VERIFICATION', 0, currentY, {
             width: pageWidth,
             align: 'center'
           });

        currentY += 20;
        
        if (birthData.ipfsCid) {
          doc.fillColor(textColor)
             .fontSize(8)
             .font('Helvetica')
             .text(`IPFS Hash: ${birthData.ipfsCid}`, 80, currentY);
          currentY += 15;
        }
      }

      // Footer section
      const footerY = pageHeight - 150;
      
      // Signature lines
      const signatureY = footerY - 50;
      const sig1X = 120;
      const sig2X = pageWidth - 200;
      
      // Signature line 1
      doc.moveTo(sig1X, signatureY)
         .lineTo(sig1X + 120, signatureY)
         .strokeColor('#666')
         .lineWidth(1)
         .stroke();

      doc.fillColor(textColor)
         .fontSize(10)
         .text('Registrar Signature', sig1X, signatureY + 10);

      // Signature line 2
      doc.moveTo(sig2X, signatureY)
         .lineTo(sig2X + 120, signatureY)
         .strokeColor('#666')
         .lineWidth(1)
         .stroke();

      doc.text('Date', sig2X + 40, signatureY + 10);

      // Official footer
      doc.rect(0, footerY, pageWidth, 100)
         .fill(primaryColor);

      doc.fillColor('white')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('GOVERNMENT BIRTH REGISTRATION OFFICE', 0, footerY + 20, {
           width: pageWidth,
           align: 'center'
         });

      doc.fontSize(10)
         .font('Helvetica')
         .text('This is an official government document', 0, footerY + 40, {
           width: pageWidth,
           align: 'center'
         })
         .text('Digitally generated and stored on IPFS blockchain for authenticity', 0, footerY + 55, {
           width: pageWidth,
           align: 'center'
         });

      // QR code placeholder (you can integrate a QR code library)
      if (birthData.certificateUrl) {
        doc.rect(pageWidth - 80, footerY - 80, 60, 60)
           .strokeColor('white')
           .lineWidth(1)
           .stroke();
           
        doc.fillColor('white')
           .fontSize(8)
           .text('QR CODE', pageWidth - 75, footerY - 50, { width: 50, align: 'center' })
           .text('VERIFY', pageWidth - 75, footerY - 40, { width: 50, align: 'center' });
      }

      // Watermark
      doc.fillColor('#f0f0f0')
         .fontSize(60)
         .font('Helvetica-Bold')
         .text('OFFICIAL', pageWidth/2 - 100, pageHeight/2 - 30, {
           width: 200,
           align: 'center',
           opacity: 0.1
         });

      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    storacha: storachaClient ? 'connected' : 'disconnected',
    web3: wallet ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Submit birth registration with document upload and NFT minting
app.post('/birth-registration', upload.single('supportingDocument'), async (req, res) => {
  try {
    const birthData = JSON.parse(req.body.birthData);

    console.log('📋 Processing birth registration:', birthData.firstName, birthData.lastName);

    if (!storachaClient) {
      return res.status(500).json({ error: 'Storacha client not initialized' });
    }

    let supportingDocumentCid = null;

    // Upload supporting document if provided
    if (req.file) {
      console.log('📄 Uploading supporting document...');
      const fileBuffer = fs.readFileSync(req.file.path);
      const file = new File([fileBuffer], req.file.originalname, {
        type: req.file.mimetype
      });

      supportingDocumentCid = await storachaClient.uploadFile(file);
      fs.unlinkSync(req.file.path); // Clean up

      console.log('✅ Supporting document uploaded:', supportingDocumentCid.toString());
    }

    // Generate PDF birth certificate
    console.log('📜 Generating birth certificate PDF...');
    const pdfBuffer = await generateBirthCertificatePDF({
      ...birthData,
      supportingDocumentCid: supportingDocumentCid?.toString()
    });

    // Upload PDF to IPFS
    const pdfFile = new File([pdfBuffer], `birth-certificate-${Date.now()}.pdf`, {
      type: 'application/pdf'
    });

    const certificateCid = await storachaClient.uploadFile(pdfFile);
    console.log('✅ Birth certificate uploaded to IPFS:', certificateCid.toString());

    // Create metadata for NFT
    const metadata = {
      name: `Birth Certificate - ${birthData.firstName} ${birthData.lastName}`,
      description: `Official birth certificate for ${birthData.firstName} ${birthData.lastName}, born on ${birthData.dateOfBirth}`,
      image: `https://${certificateCid}.ipfs.storacha.link`,
      attributes: [
        { trait_type: "Full Name", value: `${birthData.firstName} ${birthData.middleName || ''} ${birthData.lastName}`.trim() },
        { trait_type: "Date of Birth", value: birthData.dateOfBirth },
        { trait_type: "Place of Birth", value: birthData.placeOfBirth },
        { trait_type: "Certificate Type", value: "Birth Certificate" },
        { trait_type: "Issue Date", value: new Date().toISOString().split('T')[0] }
      ],
      external_url: `https://${certificateCid}.ipfs.storacha.link`,
      certificate_cid: certificateCid.toString(),
      supporting_document_cid: supportingDocumentCid?.toString()
    };

    // Upload metadata to IPFS
    const metadataFile = new File([JSON.stringify(metadata, null, 2)], 'metadata.json', {
      type: 'application/json'
    });

    const metadataCid = await storachaClient.uploadFile(metadataFile);
    console.log('✅ Metadata uploaded to IPFS:', metadataCid.toString());

    let nftTokenId = null;
    let nftTransactionHash = null;

    // Mint NFT if Web3 is configured and wallet address is provided
    if (nftContract && birthData.wallet && ethers.isAddress(birthData.wallet)) {
      try {
        console.log('🎨 Minting NFT...');
        const tokenURI = `https://${metadataCid}.ipfs.storacha.link`;

        // const tx = await nftContract.mint(birthData.wallet, tokenURI);
        const tx = await nftContract.mint(birthData.wallet, tokenURI, {
          gasLimit: 100000,
          gasPrice: ethers.parseUnits('1', 'gwei')
        });
        await tx.wait();

        nftTransactionHash = tx.hash;

        // Get token ID from transaction receipt
        const receipt = await provider.getTransactionReceipt(tx.hash);
        const mintEvent = receipt.logs.find(log => log.topics[0] === ethers.id("Transfer(address,address,uint256)"));

        if (mintEvent) {
          nftTokenId = parseInt(mintEvent.topics[3], 16);
        }

        console.log('✅ NFT minted successfully:', nftTokenId);

      } catch (nftError) {
        console.error('❌ NFT minting failed:', nftError);
        // Continue without NFT - the certificate is still valid
      }
    }

    const response = {
      success: true,
      certificateId: `BC-${Date.now()}`,
      certificate: {
        cid: certificateCid.toString(),
        gatewayUrl: `https://${certificateCid}.ipfs.storacha.link`,
        ipfsUrl: `ipfs://${certificateCid}`
      },
      metadata: {
        cid: metadataCid.toString(),
        gatewayUrl: `https://${metadataCid}.ipfs.storacha.link`,
        ipfsUrl: `ipfs://${metadataCid}`
      },
      supportingDocument: supportingDocumentCid ? {
        cid: supportingDocumentCid.toString(),
        gatewayUrl: `https://${supportingDocumentCid}.ipfs.storacha.link`,
        ipfsUrl: `ipfs://${supportingDocumentCid}`
      } : null,
      nft: nftTokenId ? {
        tokenId: nftTokenId,
        transactionHash: nftTransactionHash,
        contractAddress: process.env.NFT_CONTRACT_ADDRESS,
        ownerAddress: birthData.wallet
      } : null,
      registeredAt: new Date().toISOString()
    };

    console.log('🎉 Birth registration completed successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Birth registration failed:', error);

    // Clean up temporary file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Birth registration failed',
      message: error.message
    });
  }
});

// Get certificate by CID
app.get('/certificate/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    const gatewayUrl = `https://${cid}.ipfs.storacha.link`;

    res.json({
      cid,
      gatewayUrl,
      ipfsUrl: `ipfs://${cid}`,
      type: 'birth_certificate'
    });

  } catch (error) {
    console.error('❌ Failed to get certificate:', error);
    res.status(500).json({
      error: 'Failed to get certificate',
      message: error.message
    });
  }
});

// Verify NFT ownership
app.get('/verify-nft/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;

    if (!nftContract) {
      return res.status(500).json({ error: 'NFT contract not initialized' });
    }

    const owner = await nftContract.ownerOf(tokenId);
    const tokenURI = await nftContract.tokenURI(tokenId);

    res.json({
      tokenId,
      owner,
      tokenURI,
      verified: true
    });

  } catch (error) {
    console.error('❌ Failed to verify NFT:', error);
    res.status(500).json({
      error: 'Failed to verify NFT',
      message: error.message,
      verified: false
    });
  }
});

// Generate wallet address (simple random wallet)
app.post('/generate-wallet', (req, res) => {
  try {
    const newWallet = ethers.Wallet.createRandom();

    res.json({
      address: newWallet.address,
      privateKey: newWallet.privateKey, // ⚠️ In production, never return private keys
      mnemonic: newWallet.mnemonic?.phrase
    });

  } catch (error) {
    console.error('❌ Failed to generate wallet:', error);
    res.status(500).json({
      error: 'Failed to generate wallet',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
async function startServer() {
  try {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }

    // Initialize Storacha first
    await initializeStoracha();

    // Initialize Web3 (optional)
    await initializeWeb3();

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('📋 Available endpoints:');
      console.log('  GET  /health - Health check');
      console.log('  POST /birth-registration - Submit birth registration with NFT minting');
      console.log('  GET  /certificate/:cid - Get certificate info');
      console.log('  GET  /verify-nft/:tokenId - Verify NFT ownership');
      console.log('  POST /generate-wallet - Generate new wallet');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();