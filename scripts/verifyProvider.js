const { ethers } = require("hardhat");

async function main() {
  const [verifier] = await ethers.getSigners();
  
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const providerAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  
  console.log("Verifying provider with address:", providerAddress);
  console.log("Using verifier account:", verifier.address);
  
  const ServiceProviderRegistry = await ethers.getContractAt("ServiceProviderRegistry", contractAddress);
  
  // Get provider ID
  const providerId = await ServiceProviderRegistry.addressToProviderId(providerAddress);
  console.log("Provider ID:", providerId.toString());
  
  if (providerId.toString() === "0") {
    console.log("❌ Provider not found!");
    return;
  }
  
  // Verify the provider
  const tx = await ServiceProviderRegistry.verifyProvider(providerId);
  await tx.wait();
  
  console.log("✅ Provider verified successfully!");
  console.log("Transaction hash:", tx.hash);
  
  // Verify status
  const isVerified = await ServiceProviderRegistry.isProviderVerified(providerAddress);
  console.log("Provider verification status:", isVerified);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });