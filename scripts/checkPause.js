// scripts/check-pause.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking with account:", deployer.address);
  
  const NGORegistry = await ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  
  const isPaused = await ngoRegistry.paused();
  console.log("Contract paused:", isPaused);
  
  if (isPaused) {
    console.log("Contract is PAUSED - unpausing now...");
    const tx = await ngoRegistry.unpause();
    await tx.wait();
    console.log("Contract unpaused successfully!");
  } else {
    console.log("Contract is NOT paused - check other issues");
  }
}

main().catch(console.error);