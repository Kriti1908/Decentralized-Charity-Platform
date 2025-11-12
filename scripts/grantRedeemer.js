const { ethers } = require("hardhat");

async function main() {
  const [admin] = await ethers.getSigners();
  const soulboundTokenAddress = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9";
  const serviceProviderAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  
  console.log("Admin:", admin.address);
  console.log("Granting REDEEMER_ROLE to:", serviceProviderAddress);
  
  const SoulboundToken = await ethers.getContractAt("SoulboundToken", soulboundTokenAddress);
  
  // Grant REDEEMER_ROLE to service provider
  const REDEEMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REDEEMER_ROLE"));
  const tx = await SoulboundToken.grantRole(REDEEMER_ROLE, serviceProviderAddress);
  await tx.wait();
  
  console.log("✅ REDEEMER_ROLE granted successfully!");
  console.log("Transaction hash:", tx.hash);
  
  // Verify the role was granted
  const hasRole = await SoulboundToken.hasRole(REDEEMER_ROLE, serviceProviderAddress);
  console.log("Service provider has REDEEMER_ROLE:", hasRole);
}

main().catch(console.error);