// scripts/check-roles.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer, user] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("User (you):", user.address);
  
  const NGORegistry = await ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  
  // Check roles
  const DEFAULT_ADMIN_ROLE = await ngoRegistry.DEFAULT_ADMIN_ROLE();
  const ADMIN_ROLE = await ngoRegistry.ADMIN_ROLE();
  const VERIFIER_ROLE = await ngoRegistry.VERIFIER_ROLE();
  
  console.log("\n=== ROLE CHECK ===");
  console.log("Deployer has DEFAULT_ADMIN_ROLE:", await ngoRegistry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
  console.log("Deployer has ADMIN_ROLE:", await ngoRegistry.hasRole(ADMIN_ROLE, deployer.address));
  console.log("Deployer has VERIFIER_ROLE:", await ngoRegistry.hasRole(VERIFIER_ROLE, deployer.address));
  
  console.log("User has DEFAULT_ADMIN_ROLE:", await ngoRegistry.hasRole(DEFAULT_ADMIN_ROLE, user.address));
  console.log("User has ADMIN_ROLE:", await ngoRegistry.hasRole(ADMIN_ROLE, user.address));
  console.log("User has VERIFIER_ROLE:", await ngoRegistry.hasRole(VERIFIER_ROLE, user.address));
  
  // Check if user is already registered
  const userNgoId = await ngoRegistry.addressToNgoId(user.address);
  console.log("\n=== USER REGISTRATION STATUS ===");
  console.log("User NGO ID:", userNgoId.toString());
  if (userNgoId > 0) {
    const ngoData = await ngoRegistry.ngos(userNgoId);
    console.log("Already registered as:", ngoData.name);
  }
}

main().catch(console.error);