const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Step 1: Deploy NGOGovernance first
  console.log("1. Deploying NGOGovernance...");
  const NGOGovernance = await hre.ethers.getContractFactory("NGOGovernance");
  const ngoGovernance = await NGOGovernance.deploy();
  await ngoGovernance.waitForDeployment();
  const ngoGovernanceAddress = await ngoGovernance.getAddress();
  console.log("✅ NGOGovernance deployed to:", ngoGovernanceAddress);

  // Step 2: Deploy NGORegistry with governance address
  console.log("\n2. Deploying NGORegistry with governance address...");
  const NGORegistry = await hre.ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.deploy(ngoGovernanceAddress);
  await ngoRegistry.waitForDeployment();
  const ngoRegistryAddress = await ngoRegistry.getAddress();
  console.log("✅ NGORegistry deployed to:", ngoRegistryAddress);

  // Step 3: Deploy ServiceProviderRegistry
  console.log("\n3. Deploying ServiceProviderRegistry...");
  const ServiceProviderRegistry = await hre.ethers.getContractFactory("ServiceProviderRegistry");
  const serviceProviderRegistry = await ServiceProviderRegistry.deploy();
  await serviceProviderRegistry.waitForDeployment();
  const serviceProviderRegistryAddress = await serviceProviderRegistry.getAddress();
  console.log("✅ ServiceProviderRegistry deployed to:", serviceProviderRegistryAddress);

  // Step 4: Deploy SoulboundToken
  console.log("\n4. Deploying SoulboundToken...");
  const SoulboundToken = await hre.ethers.getContractFactory("SoulboundToken");
  const soulboundToken = await SoulboundToken.deploy();
  await soulboundToken.waitForDeployment();
  const soulboundTokenAddress = await soulboundToken.getAddress();
  console.log("✅ SoulboundToken deployed to:", soulboundTokenAddress);

  // Step 5: Deploy CampaignFactory
  console.log("\n5. Deploying CampaignFactory...");
  const feeCollector = deployer.address; // Using deployer as fee collector for now
  const CampaignFactory = await hre.ethers.getContractFactory("CampaignFactory");
  const campaignFactory = await CampaignFactory.deploy(
    ngoRegistryAddress,
    soulboundTokenAddress,
    feeCollector
  );
  await campaignFactory.waitForDeployment();
  const campaignFactoryAddress = await campaignFactory.getAddress();
  console.log("✅ CampaignFactory deployed to:", campaignFactoryAddress);

  // Step 6: Set up roles and permissions
  console.log("\n6. Setting up roles and permissions...");

  // Grant MINTER_ROLE to CampaignFactory on SoulboundToken
  const MINTER_ROLE = await soulboundToken.MINTER_ROLE();
  await soulboundToken.grantRole(MINTER_ROLE, campaignFactoryAddress);
  console.log("✅ Granted MINTER_ROLE to CampaignFactory on SoulboundToken");

  // Grant REDEEMER_ROLE to ServiceProviderRegistry on SoulboundToken
  const REDEEMER_ROLE = await soulboundToken.REDEEMER_ROLE();
  await soulboundToken.grantRole(REDEEMER_ROLE, serviceProviderRegistryAddress);
  console.log("✅ Granted REDEEMER_ROLE to ServiceProviderRegistry on SoulboundToken");

  // Grant ADMIN_ROLE to deployer on NGOGovernance
  const GOVERNANCE_ADMIN_ROLE = await ngoGovernance.DEFAULT_ADMIN_ROLE();
  await ngoGovernance.grantRole(GOVERNANCE_ADMIN_ROLE, deployer.address);
  console.log("✅ Granted ADMIN_ROLE to deployer on NGOGovernance");

  // Grant VERIFIER_ROLE to deployer on NGORegistry
  const VERIFIER_ROLE = await ngoRegistry.VERIFIER_ROLE();
  await ngoRegistry.grantRole(VERIFIER_ROLE, deployer.address);
  console.log("✅ Granted VERIFIER_ROLE to deployer on NGORegistry");

  // Grant ADMIN_ROLE to deployer on NGORegistry
  const REGISTRY_ADMIN_ROLE = await ngoRegistry.ADMIN_ROLE();
  await ngoRegistry.grantRole(REGISTRY_ADMIN_ROLE, deployer.address);
  console.log("✅ Granted ADMIN_ROLE to deployer on NGORegistry");

  // Verify governance connection
  console.log("\n7. Verifying governance setup...");
  const governanceInRegistry = await ngoRegistry.governance();
  console.log("✅ Governance address in NGORegistry:", governanceInRegistry);
  
  if (governanceInRegistry.toLowerCase() === ngoGovernanceAddress.toLowerCase()) {
    console.log("✅ Governance connection verified successfully");
  } else {
    console.log("❌ Governance connection mismatch!");
  }

  // Step 7: Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      NGOGovernance: ngoGovernanceAddress,
      NGORegistry: ngoRegistryAddress,
      ServiceProviderRegistry: serviceProviderRegistryAddress,
      SoulboundToken: soulboundTokenAddress,
      CampaignFactory: campaignFactoryAddress,
    },
    roles: {
      feeCollector: feeCollector,
      governanceAdmin: deployer.address,
      registryAdmin: deployer.address,
      verifier: deployer.address,
    },
    governance: {
      connected: governanceInRegistry === ngoGovernanceAddress,
      governanceAddress: ngoGovernanceAddress,
      registryAddress: ngoRegistryAddress,
    }
  };

  const deploymentPath = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const fileName = `deployment-${hre.network.name}-${Date.now()}.json`;
  const filePath = path.join(deploymentPath, fileName);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

  // Also save to a latest file for easy access
  const latestFileName = `deployment-${hre.network.name}-latest.json`;
  const latestFilePath = path.join(deploymentPath, latestFileName);
  fs.writeFileSync(latestFilePath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📁 Deployment info saved to:");
  console.log("   -", filePath);
  console.log("   -", latestFilePath);

  // Step 8: Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n=== Verification Instructions ===");
    console.log("Run these commands to verify contracts on Etherscan:");
    console.log(`\nnpx hardhat verify --network ${hre.network.name} ${ngoGovernanceAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${ngoRegistryAddress} "${ngoGovernanceAddress}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${serviceProviderRegistryAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${soulboundTokenAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${campaignFactoryAddress} "${ngoRegistryAddress}" "${soulboundTokenAddress}" "${feeCollector}"`);
  }

  // Step 9: Frontend configuration
  console.log("\n=== Frontend Configuration ===");
  console.log("Add these to your .env.local file:");
  console.log(`NEXT_PUBLIC_NGO_GOVERNANCE_ADDRESS=${ngoGovernanceAddress}`);
  console.log(`NEXT_PUBLIC_NGO_REGISTRY_ADDRESS=${ngoRegistryAddress}`);
  console.log(`NEXT_PUBLIC_SOULBOUND_TOKEN_ADDRESS=${soulboundTokenAddress}`);
  console.log(`NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=${campaignFactoryAddress}`);
  console.log(`NEXT_PUBLIC_SERVICE_PROVIDER_REGISTRY_ADDRESS=${serviceProviderRegistryAddress}`);

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });