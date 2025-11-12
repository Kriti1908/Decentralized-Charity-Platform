// scripts/debug-contract.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer, user] = await ethers.getSigners();
  
  console.log("🔍 === CONTRACT DEBUG ===");
  console.log("Deployer:", deployer.address);
  console.log("User:", user.address);
  
  const NGORegistry = await ethers.getContractFactory("NGORegistry");
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const ngoRegistry = await NGORegistry.attach(contractAddress);
  
  // Check basic contract state
  console.log("\n📊 === CONTRACT STATE ===");
  const paused = await ngoRegistry.paused();
  console.log("Paused:", paused);
  
  const totalNGOs = await ngoRegistry.getTotalNGOs();
  console.log("Total NGOs:", totalNGOs.toString());
  
  // Check roles
  console.log("\n👥 === ROLE CHECK ===");
  const DEFAULT_ADMIN_ROLE = await ngoRegistry.DEFAULT_ADMIN_ROLE();
  const ADMIN_ROLE = await ngoRegistry.ADMIN_ROLE();
  const VERIFIER_ROLE = await ngoRegistry.VERIFIER_ROLE();
  
  console.log("Deployer is admin:", await ngoRegistry.hasRole(ADMIN_ROLE, deployer.address));
  console.log("User is admin:", await ngoRegistry.hasRole(ADMIN_ROLE, user.address));
  
  // Check governance
  console.log("\n🏛️ === GOVERNANCE CHECK ===");
  const governanceAddress = await ngoRegistry.governance();
  console.log("Governance address:", governanceAddress);
  
  const governanceCode = await ethers.provider.getCode(governanceAddress);
  console.log("Governance deployed:", governanceCode !== "0x");
  
  // Try direct registration call
  console.log("\n🚀 === TEST REGISTRATION ===");
  try {
    console.log("Attempting registration...");
    const tx = await ngoRegistry.connect(user).registerNGO(
      user.address,
      "Test NGO",
      "TEST123",
      "India",
      "Health",
      "QmTest",
      { gasLimit: 500000 }
    );
    
    console.log("✅ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Verify registration
    const ngoId = await ngoRegistry.addressToNgoId(user.address);
    console.log("✅ Registered NGO ID:", ngoId.toString());
    
  } catch (error) {
    console.log("❌ Registration failed:", error.message);
    
    // Try to get more detailed error
    if (error.data) {
      console.log("Error data:", error.data);
    }
    if (error.reason) {
      console.log("Revert reason:", error.reason);
    }
  }
}

main().catch(console.error);