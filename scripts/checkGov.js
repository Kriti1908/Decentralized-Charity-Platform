// scripts/check-governance.js
const { ethers } = require("hardhat");

async function main() {
  const NGORegistry = await ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
//   console.log("wtf");
  const governanceAddress = await ngoRegistry.governance();
  console.log("Governance contract address:", governanceAddress);
  
  // Check if governance contract is deployed
  const code = await ethers.provider.getCode(governanceAddress);
  console.log("Governance contract code deployed:", code !== "0x" ? "YES" : "NO");
  
  if (code !== "0x") {
    const NGOGovernance = await ethers.getContractFactory("NGOGovernance");
    const governance = await NGOGovernance.attach(governanceAddress);
    
    // Check governance status
    const [deployer] = await ethers.getSigners();
    const userReputation = await governance.userReputations(deployer.address);
    console.log("User reputation:", userReputation.toString());
  }
}

main().catch(console.error);