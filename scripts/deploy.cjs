const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");
  console.log("📋 Network:", hre.network.name);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "POL");
  
  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance! Get test POL from faucet.");
    process.exit(1);
  }
  
  // Deploy contract
  console.log("📜 Deploying BirthCertificateNFT...");
  const BirthCertificateNFT = await ethers.getContractFactory("BirthCertificateNFT");
  const contract = await BirthCertificateNFT.deploy();
  
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log("✅ BirthCertificateNFT deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 View on explorer: https://amoy.polygonscan.com/address/" + contractAddress);
  console.log("\n📝 Add this to your .env file:");
  console.log("NFT_CONTRACT_ADDRESS=" + contractAddress);
  
  // Test the contract
  console.log("\n🧪 Testing contract...");
  const name = await contract.name();
  const symbol = await contract.symbol();
  console.log("✅ Contract name:", name);
  console.log("✅ Contract symbol:", symbol);
}

main()
  .then(() => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });