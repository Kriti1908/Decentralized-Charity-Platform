// contracts.ts
import NGORegistryABI from './abi/NGORegistry.json';
import SoulboundTokenABI from './abi/SoulboundToken.json';
import CampaignFactoryABI from './abi/CampaignFactory.json';
import ServiceProviderRegistryABI from './abi/ServiceProviderRegistry.json';
import NGOGovernanceABI from './abi/NGOGovernance.json';

export const CONTRACTS = {
  NGOGovernance: {
    address: process.env.NEXT_PUBLIC_NGO_GOVERNANCE_ADDRESS as `0x${string}`,
    abi: NGOGovernanceABI.abi,
  },
  NGORegistry: {
    address: process.env.NEXT_PUBLIC_NGO_REGISTRY_ADDRESS as `0x${string}`,
    abi: NGORegistryABI.abi,
  },
  // ... other contracts (keep them as minimal for now)
  SoulboundToken: {
    address: process.env.NEXT_PUBLIC_SOULBOUND_TOKEN_ADDRESS as `0x${string}`,
    abi: SoulboundTokenABI.abi, // Updated with actual ABI
  },
  CampaignFactory: {
    address: process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS as `0x${string}`,
    abi: CampaignFactoryABI.abi, // Updated with actual ABI
  },
  ServiceProviderRegistry: {
    address: process.env.NEXT_PUBLIC_SERVICE_PROVIDER_REGISTRY_ADDRESS as `0x${string}`,
    abi: ServiceProviderRegistryABI.abi, // Updated with actual ABI
  },
} as const;