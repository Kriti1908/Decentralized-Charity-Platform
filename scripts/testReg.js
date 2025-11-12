// scripts/test-registration.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer, user] = await ethers.getSigners();
  
  console.log("Testing with user:", user.address);
  
  const NGORegistry = await ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  
  try {
    console.log("Attempting registration...");
    const tx = await ngoRegistry.connect(user).registerNGO(
      user.address,
      "Test Health Foundation",
      "TEST123",
      "India", 
      "Health",
      "QmTestHash123"
    );
    
    console.log("✅ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Check if registered
    const ngoId = await ngoRegistry.addressToNgoId(user.address);
    console.log("✅ Registered NGO ID:", ngoId.toString());
    
  } catch (error) {
    console.error("❌ Registration failed:", error.message);
    console.error("Full error:", error);
  }
}

main().catch(console.error);