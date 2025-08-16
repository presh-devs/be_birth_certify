// Enhanced server.js with SVG-only image generation
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
    
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID');
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const nftABI = [
      "function mint(address to, string memory tokenURI) public returns (uint256)",
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
      "function balanceOf(address owner) public view returns (uint256)",
      "function ownerOf(uint256 tokenId) public view returns (address)"
    ];
    
    nftContract = new ethers.Contract(
      process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      nftABI,
      wallet
    );
    
    console.log('✅ Web3 initialized successfully');
    console.log('📝 Wallet address:', wallet.address);
    
  } catch (error) {
    console.error('❌ Failed to initialize Web3:', error);
  }
}

// 🎨 SVG CERTIFICATE GENERATOR
function generateCertificateSVG(birthData, certificateId) {
  console.log('🖼️ Generating SVG certificate...');
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#e2e8f0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#cbd5e1;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="800" fill="url(#backgroundGradient)"/>
  
  <!-- Main border -->
  <rect x="20" y="20" width="760" height="760" fill="none" stroke="#008751" stroke-width="12"/>
  
  <!-- Inner border -->
  <rect x="40" y="40" width="720" height="720" fill="none" stroke="#1e3a8a" stroke-width="4"/>
  
  <!-- Header background -->
  <rect x="0" y="0" width="800" height="180" fill="#008751"/>
  
  <!-- Nigerian coat of arms (top left) -->
  <circle cx="120" cy="90" r="50" fill="white" stroke="#1e3a8a" stroke-width="4"/>
  <circle cx="120" cy="90" r="35" fill="none" stroke="#008751" stroke-width="2"/>
  <text x="120" y="85" text-anchor="middle" fill="#008751" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
    COAT OF
  </text>
  <text x="120" y="98" text-anchor="middle" fill="#008751" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
    ARMS
  </text>
  
  <!-- Header text -->
  <text x="480" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">
    FEDERAL REPUBLIC OF NIGERIA
  </text>
  <text x="480" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
    NATIONAL POPULATION COMMISSION
  </text>
  <text x="480" y="150" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="bold">
    BIRTH CERTIFICATE
  </text>
  
  <!-- Certificate ID banner -->
  <rect x="80" y="200" width="640" height="60" fill="#fbbf24" stroke="#f59e0b" stroke-width="3" filter="url(#shadow)"/>
  <text x="400" y="240" text-anchor="middle" fill="black" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
    ${certificateId}
  </text>
  
  <!-- Main content area -->
  <rect x="80" y="280" width="640" height="300" fill="white" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
  
  <!-- Child name (prominent) -->
  <text x="400" y="330" text-anchor="middle" fill="#1e3a8a" font-family="Arial, sans-serif" font-size="36" font-weight="bold">
    ${birthData.firstName.toUpperCase()} ${birthData.lastName.toUpperCase()}
  </text>
  
  <!-- Birth details section header -->
  <text x="400" y="370" text-anchor="middle" fill="#1f2937" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
    BIRTH DETAILS
  </text>
  
  <!-- Birth details -->
  <text x="100" y="410" fill="#6b7280" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    Date of Birth:
  </text>
  <text x="320" y="410" fill="#1f2937" font-family="Arial, sans-serif" font-size="16">
    ${birthData.dateOfBirth}
  </text>
  
  <text x="100" y="440" fill="#6b7280" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    Place of Birth:
  </text>
  <text x="320" y="440" fill="#1f2937" font-family="Arial, sans-serif" font-size="16">
    ${birthData.placeOfBirth}
  </text>
  
  <text x="100" y="470" fill="#6b7280" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    Mother:
  </text>
  <text x="320" y="470" fill="#1f2937" font-family="Arial, sans-serif" font-size="16">
    ${birthData.motherFirstName} ${birthData.motherLastName}
  </text>
  
  <text x="100" y="500" fill="#6b7280" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    Father:
  </text>
  <text x="320" y="500" fill="#1f2937" font-family="Arial, sans-serif" font-size="16">
    ${birthData.fatherFirstName} ${birthData.fatherLastName}
  </text>
  
  <text x="100" y="530" fill="#6b7280" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    Mother's NIN:
  </text>
  <text x="320" y="530" fill="#1f2937" font-family="Arial, sans-serif" font-size="16">
    ${birthData.motherNIN}
  </text>
  
  <text x="100" y="560" fill="#6b7280" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    Father's NIN:
  </text>
  <text x="320" y="560" fill="#1f2937" font-family="Arial, sans-serif" font-size="16">
    ${birthData.fatherNIN}
  </text>
  
  <!-- Authentication section -->
  <rect x="80" y="600" width="640" height="120" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
  
  <!-- Registrar signature -->
  <text x="100" y="640" fill="#1e3a8a" font-family="Arial, sans-serif" font-size="22" font-weight="bold" font-style="italic">
    Precious Adebayo
  </text>
  <text x="100" y="665" fill="#64748b" font-family="Arial, sans-serif" font-size="14">
    Registrar of Births and Deaths
  </text>
  <text x="100" y="685" fill="#64748b" font-family="Arial, sans-serif" font-size="14">
    Lagos State Registry
  </text>
  <text x="100" y="705" fill="#64748b" font-family="Arial, sans-serif" font-size="14">
    Issued: ${new Date().toLocaleDateString('en-GB')}
  </text>
  
  <!-- Official seal -->
  <circle cx="600" cy="660" r="40" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>
  <circle cx="600" cy="660" r="28" fill="none" stroke="white" stroke-width="2"/>
  <text x="600" y="650" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
    OFFICIAL
  </text>
  <text x="600" y="665" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
    SEAL
  </text>
  <text x="600" y="685" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">
    LAGOS STATE
  </text>
  
  <!-- Footer -->
  <rect x="0" y="740" width="800" height="60" fill="#008751"/>
  <text x="400" y="770" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    BLOCKCHAIN VERIFIED CERTIFICATE
  </text>
</svg>`;

  console.log('✅ SVG certificate generated');
  return Buffer.from(svg, 'utf8');
}

// PDF Birth Certificate Generator - Matching SVG Design
async function generateBirthCertificatePDF(birthData, certificateId) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 0,
        size: [600, 600], // Square format like SVG
        info: {
          Title: 'Official Birth Certificate',
          Author: 'Federal Government of Nigeria - National Population Commission',
          Subject: `Birth Certificate for ${birthData.firstName} ${birthData.lastName}`,
          Creator: 'National Identity Management System',
          Keywords: 'birth certificate, official document, government issued'
        }
      });
      
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Define official colors (matching SVG)
      const nigeriaGreen = '#008751';
      const nigeriaWhite = '#ffffff';
      const officialBlue = '#1e3a8a';
      const textDark = '#1f2937';
      const lightGray = '#f8fafc';
      const mediumGray = '#e2e8f0';
      const borderGray = '#cbd5e1';
      const goldYellow = '#fbbf24';
      const redSeal = '#dc2626';

      // Background gradient effect (simulated with rectangles)
      doc.rect(0, 0, 600, 600)
         .fillColor(lightGray)
         .fill();

      // Main border (matching SVG)
      doc.rect(15, 15, 570, 570)
         .strokeColor(nigeriaGreen)
         .lineWidth(9)
         .stroke();

      // Inner border
      doc.rect(30, 30, 540, 540)
         .strokeColor(officialBlue)
         .lineWidth(3)
         .stroke();

      // Header background
      doc.rect(0, 0, 600, 135)
         .fillColor(nigeriaGreen)
         .fill();

      // Nigerian coat of arms (top left)
      doc.circle(90, 67, 37)
         .fillColor(nigeriaWhite)
         .fill()
         .strokeColor(officialBlue)
         .lineWidth(3)
         .stroke();

      doc.circle(90, 67, 26)
         .strokeColor(nigeriaGreen)
         .lineWidth(1.5)
         .stroke();

      // Coat of arms text
      doc.fontSize(9)
         .fillColor(nigeriaGreen)
         .font('Helvetica-Bold')
         .text('COAT OF', 90, 60, { align: 'center', width: 0 });
      
      doc.text('ARMS', 90, 72, { align: 'center', width: 0 });

      // Header text (positioned to the right of coat of arms)
      doc.fontSize(21)
         .fillColor(nigeriaWhite)
         .font('Helvetica-Bold')
         .text('FEDERAL REPUBLIC OF NIGERIA', 200, 37, { 
           align: 'center', 
           width: 350 
         });

      doc.fontSize(15)
         .text('NATIONAL POPULATION COMMISSION', 200, 60, { 
           align: 'center', 
           width: 350 
         });

      doc.fontSize(24)
         .text('BIRTH CERTIFICATE', 200, 112, { 
           align: 'center', 
           width: 350 
         });

      // Certificate ID banner (matching SVG)
      doc.rect(60, 150, 480, 45)
         .fillColor(goldYellow)
         .fill()
         .strokeColor('#f59e0b')
         .lineWidth(2)
         .stroke();

      doc.fontSize(18)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(certificateId, 60, 170, { align: 'center', width: 480 });

      // Main content area (white background)
      doc.rect(60, 210, 480, 225)
         .fillColor(nigeriaWhite)
         .fill()
         .strokeColor(borderGray)
         .lineWidth(1.5)
         .stroke();

      // Child name (prominent)
      doc.fontSize(27)
         .fillColor(officialBlue)
         .font('Helvetica-Bold')
         .text(`${birthData.firstName.toUpperCase()} ${birthData.lastName.toUpperCase()}`, 
               60, 240, { align: 'center', width: 480 });

      // Birth details section header
      doc.fontSize(13)
         .fillColor(textDark)
         .font('Helvetica-Bold')
         .text('BIRTH DETAILS', 60, 275, { align: 'center', width: 480 });

      // Birth details (matching SVG layout)
      const detailsStartY = 300;
      const lineHeight = 22;

      const details = [
        ['Date of Birth:', birthData.dateOfBirth],
        ['Place of Birth:', birthData.placeOfBirth],
        ['Mother:', `${birthData.motherFirstName} ${birthData.motherLastName}`],
        ['Father:', `${birthData.fatherFirstName} ${birthData.fatherLastName}`],
        ['Mother\'s NIN:', birthData.motherNIN],
        ['Father\'s NIN:', birthData.fatherNIN]
      ];

      details.forEach(([label, value], index) => {
        const yPos = detailsStartY + (index * lineHeight);
        
        // Label
        doc.fontSize(12)
           .fillColor('#6b7280')
           .font('Helvetica-Bold')
           .text(label, 75, yPos, { width: 150 });
        
        // Value
        doc.fillColor(textDark)
           .font('Helvetica')
           .text(value, 240, yPos, { width: 280 });
      });

      // Authentication section (matching SVG)
      doc.rect(60, 450, 480, 90)
         .fillColor('#f1f5f9')
         .fill()
         .strokeColor(borderGray)
         .lineWidth(1.5)
         .stroke();

      // Registrar signature
      doc.fontSize(16)
         .fillColor(officialBlue)
         .font('Times-BoldItalic')
         .text('Precious Adebayo', 75, 470);

      doc.fontSize(10)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('Registrar of Births and Deaths', 75, 490);

      doc.text('Lagos State Registry', 75, 505);

      doc.text(`Issued: ${new Date().toLocaleDateString('en-GB')}`, 75, 520);

      // Official seal (matching SVG)
      const sealX = 450;
      const sealY = 495;

      doc.circle(sealX, sealY, 30)
         .fillColor(redSeal)
         .fill()
         .strokeColor('#991b1b')
         .lineWidth(2)
         .stroke();

      doc.circle(sealX, sealY, 21)
         .strokeColor(nigeriaWhite)
         .lineWidth(1.5)
         .stroke();

      // Seal text
      doc.fontSize(9)
         .fillColor(nigeriaWhite)
         .font('Helvetica-Bold')
         .text('OFFICIAL', sealX, sealY - 8, { align: 'center', width: 0 });

      doc.text('SEAL', sealX, sealY + 2, { align: 'center', width: 0 });

      doc.fontSize(6)
         .text('LAGOS STATE', sealX, sealY + 15, { align: 'center', width: 0 });

      // Footer (matching SVG)
      doc.rect(0, 555, 600, 45)
         .fillColor(nigeriaGreen)
         .fill();

      doc.fontSize(12)
         .fillColor(nigeriaWhite)
         .font('Helvetica-Bold')
         .text('BLOCKCHAIN VERIFIED CERTIFICATE', 0, 575, { 
           align: 'center', 
           width: 600 
         });

      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

// DEBUG ENDPOINTS

// Test SVG certificate generation
app.get('/test-svg-certificate', async (req, res) => {
  try {
    const testData = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '01/01/2000',
      placeOfBirth: 'Lagos Hospital',
      motherFirstName: 'Jane',
      motherLastName: 'Doe',
      fatherFirstName: 'James',
      fatherLastName: 'Doe',
      motherNIN: '12345678901',
      fatherNIN: '10987654321'
    };
    
    const svgBuffer = generateCertificateSVG(testData, 'BC-TEST-12345');
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', 'inline; filename="test-certificate.svg"');
    res.send(svgBuffer);
    
  } catch (error) {
    res.status(500).json({
      error: 'SVG test failed',
      message: error.message
    });
  }
});

// MAIN BIRTH REGISTRATION ENDPOINT
app.post('/birth-registration', upload.single('supportingDocument'), async (req, res) => {
  try {
    const birthData = JSON.parse(req.body.birthData);
    
    console.log('📋 Processing birth registration:', birthData.firstName, birthData.lastName);

    if (!storachaClient) {
      return res.status(500).json({ error: 'Storacha client not initialized' });
    }

    const certificateId = `BC-${Date.now()}`;
    console.log('🆔 Generated certificate ID:', certificateId);

    let supportingDocumentCid = null;
    
    // Upload supporting document if provided
    if (req.file) {
      console.log('📄 Uploading supporting document...');
      const fileBuffer = fs.readFileSync(req.file.path);
      const file = new File([fileBuffer], req.file.originalname, {
        type: req.file.mimetype
      });
      
      supportingDocumentCid = await storachaClient.uploadFile(file);
      fs.unlinkSync(req.file.path);
      
      console.log('✅ Supporting document uploaded:', supportingDocumentCid.toString());
    }

    // Generate PDF birth certificate
    console.log('📜 Generating birth certificate PDF...');
    const pdfBuffer = await generateBirthCertificatePDF(birthData, certificateId);

    const pdfFile = new File([pdfBuffer], `birth-certificate-${certificateId}.pdf`, {
      type: 'application/pdf'
    });
    
    const certificateCid = await storachaClient.uploadFile(pdfFile);
    console.log('✅ Birth certificate PDF uploaded to IPFS:', certificateCid.toString());

    // Generate certificate SVG image
    console.log('🖼️ Generating certificate SVG image...');
    const svgBuffer = generateCertificateSVG(birthData, certificateId);
    
    console.log('✅ Certificate SVG generated:', {
      size: svgBuffer.length,
      type: 'image/svg+xml'
    });
    
    // Upload SVG image to IPFS
    const imageFileName = `nft-image-${certificateId}.svg`;
    const imageFile = new File([svgBuffer], imageFileName, {
      type: 'image/svg+xml'
    });
    
    const imageCid = await storachaClient.uploadFile(imageFile);
    console.log('✅ Certificate SVG uploaded to IPFS:', imageCid.toString());

    // Create NFT metadata
    const metadata = {
      name: `Birth Certificate - ${birthData.firstName} ${birthData.lastName}`,
      description: `Official birth certificate NFT for ${birthData.firstName} ${birthData.lastName}, born on ${birthData.dateOfBirth}. This NFT represents a legally recognized birth certificate issued by the Federal Republic of Nigeria.`,
      image: `https://${imageCid}.ipfs.storacha.link`,
      animation_url: `https://${certificateCid}.ipfs.storacha.link`,
      external_url: `https://your-domain.com/verify/${certificateId}`,
      attributes: [
        { trait_type: "Certificate ID", value: certificateId },
        { trait_type: "Full Name", value: `${birthData.firstName} ${birthData.middleName || ''} ${birthData.lastName}`.trim() },
        { trait_type: "Date of Birth", value: birthData.dateOfBirth },
        { trait_type: "Place of Birth", value: birthData.placeOfBirth },
        { trait_type: "Certificate Type", value: "Birth Certificate" },
        { trait_type: "Issue Date", value: new Date().toISOString().split('T')[0] },
        { trait_type: "Country", value: "Nigeria" },
        { trait_type: "State", value: "Lagos" },
        { trait_type: "Registrar", value: "Precious Adebayo" },
        { trait_type: "Registry", value: "Lagos State Registry" },
        { trait_type: "Verification", value: "Blockchain Verified" },
        { trait_type: "Image Format", value: "SVG" }
      ],
      properties: {
        certificate_id: certificateId,
        certificate_pdf_cid: certificateCid.toString(),
        certificate_image_cid: imageCid.toString(),
        image_format: "svg",
        supporting_document_cid: supportingDocumentCid?.toString(),
        issuer: "Federal Republic of Nigeria",
        registry: "National Population Commission",
        generation_method: "SVG"
      }
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
        
        const tx = await nftContract.mint(birthData.wallet, tokenURI);
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
      }
    }

    const response = {
      success: true,
      certificateId: certificateId,
      certificate: {
        cid: certificateCid.toString(),
        gatewayUrl: `https://${certificateCid}.ipfs.storacha.link`,
        ipfsUrl: `ipfs://${certificateCid}`
      },
      certificateImage: {
        cid: imageCid.toString(),
        gatewayUrl: `https://${imageCid}.ipfs.storacha.link`,
        ipfsUrl: `ipfs://${imageCid}`,
        format: "svg",
        mimeType: "image/svg+xml"
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
        ownerAddress: birthData.wallet,
        imageUrl: `https://${imageCid}.ipfs.storacha.link`,
        metadataUrl: `https://${metadataCid}.ipfs.storacha.link`
      } : null,
      generationInfo: {
        method: 'SVG',
        imageFormat: 'svg'
      },
      registeredAt: new Date().toISOString()
    };

    console.log('🎉 Birth registration completed successfully with certificate ID:', certificateId);
    console.log('🖼️ Certificate image format: SVG');
    console.log('📍 Image URL:', `https://${imageCid}.ipfs.storacha.link`);
    
    res.json(response);

  } catch (error) {
    console.error('❌ Birth registration failed:', error);
    
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

// Generate wallet address
app.post('/generate-wallet', (req, res) => {
  try {
    const newWallet = ethers.Wallet.createRandom();
    
    res.json({
      address: newWallet.address,
      privateKey: newWallet.privateKey,
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    storacha: storachaClient ? 'connected' : 'disconnected',
    web3: wallet ? 'connected' : 'disconnected',
    imageMethod: 'SVG',
    timestamp: new Date().toISOString()
  });
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
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }

    await initializeStoracha();
    await initializeWeb3();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🖼️ Image generation method: SVG`);
      console.log('📋 Available endpoints:');
      console.log('  GET  /health - Health check');
      console.log('  GET  /test-svg-certificate - Generate test SVG certificate');
      console.log('  POST /birth-registration - Submit birth registration');
      console.log('  GET  /certificate/:cid - Get certificate info');
      console.log('  GET  /verify-nft/:tokenId - Verify NFT ownership');
      console.log('  POST /generate-wallet - Generate new wallet');
      console.log('');
      console.log('🎯 Key features:');
      console.log('  ✅ SVG-based certificate generation');
      console.log('  ✅ Professional certificate design');
      console.log('  ✅ IPFS storage via Storacha');
      console.log('  ✅ NFT minting capability');
      console.log('  ✅ Blockchain verification');
      console.log('  ✅ No external dependencies for image generation');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();