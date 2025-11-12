const { ethers } = require('ethers');
const NGO = require('../models/NGO');
const Campaign = require('../models/Campaign');
const ServiceProvider = require('../models/ServiceProvider'); // ADD THIS LINE
const logger = require('../utils/logger');

class BlockchainSync {
  constructor() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    const ngoContractAddress = process.env.CONTRACT_ADDRESS_NGO_REGISTRY;
    const campaignContractAddress = process.env.CONTRACT_ADDRESS_CAMPAIGN_FACTORY;

    if (!ngoContractAddress || !campaignContractAddress) {
      throw new Error('Contract addresses not found in environment variables');
    }

    console.log(`Connecting to RPC: ${rpcUrl}`);
    console.log(`NGO Contract: ${ngoContractAddress}`);
    console.log(`Campaign Contract: ${campaignContractAddress}`);

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.lastBlock = 0;
    this.pollingInterval = null;
    this.isPolling = false;
    this.eventListeners = []; // Track active event listeners

    // NGO Registry Contract
    this.ngoContract = new ethers.Contract(
      ngoContractAddress,
      [
        'event NGORegistered(uint256 indexed ngoId, address indexed ngoAddress, string name)',
        'event NGOVerified(uint256 indexed ngoId, address indexed verifier)',
        'event NGOStatusChanged(uint256 indexed ngoId, uint8 oldStatus, uint8 newStatus)',
        'function getNGOById(uint256) view returns (tuple(uint256 ngoId, address ngoAddress, string name, string description, string documentsHash, uint8 status, bool isActive, uint256 createdAt, uint256 verifiedAt))'
      ],
      this.provider
    );

    // Campaign Factory Contract
    this.campaignContract = new ethers.Contract(
      campaignContractAddress,
      [
        'event CampaignCreated(uint256 indexed campaignId, address indexed ngoAddress, string title, uint256 targetAmount, uint256 deadline)',
        'event CampaignDonation(uint256 indexed campaignId, address indexed donor, uint256 amount)',
        'event CampaignStatusChanged(uint256 indexed campaignId, uint8 newStatus)',
        'event CampaignCompleted(uint256 indexed campaignId, uint256 raisedAmount)',
        'event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount)',
        'function getCampaign(uint256) view returns (tuple(uint256 campaignId, address ngoAddress, uint256 ngoId, string title, string description, string category, uint256 targetAmount, uint256 raisedAmount, uint256 startDate, uint256 endDate, uint8 status, uint256 totalDonors, uint256 totalBeneficiaries, string documentsHash, bool hasMilestones, uint256 createdAt))'
      ],
      this.provider
    );

    // Add to constructor
    this.serviceProviderContract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS_SERVICE_PROVIDER_REGISTRY,
      [
        'event ProviderRegistered(uint256 indexed providerId, address indexed providerAddress, string name)',
        'event ProviderVerified(uint256 indexed providerId)',
        'event ProviderStatusChanged(uint256 indexed providerId, uint8 oldStatus, uint8 newStatus)',
        'function getProviderByAddress(address) view returns (tuple(uint256 providerId, address providerAddress, string name, string registrationNumber, string serviceType, string location, string verificationDocHash, uint256 registeredAt, uint256 verifiedAt, uint8 status, uint256 totalRedemptions, uint256 totalAmountRedeemed, bool isActive))'
      ],
      this.provider
    );
  }

  // /**
  //  * Setup real-time event listeners (WebSocket-like for immediate updates)
  //  */
  // setupEventListeners() {
  //   console.log('Setting up real-time event listeners...');

  //   // Listen for NGO Registration
  //   this.ngoContract.on('NGORegistered', async (ngoId, ngoAddress, name, event) => {
  //     logger.info(`🔔 New NGO Registered: ${name} (ID: ${ngoId})`);
  //     await this.handleNGORegistered(ngoId);
  //   });

  //   // Listen for NGO Verification
  //   this.ngoContract.on('NGOVerified', async (ngoId, verifier, event) => {
  //     logger.info(`✅ NGO Verified: ID ${ngoId} by ${verifier}`);
  //     await this.handleNGOVerified(ngoId);
  //   });

  //   // Listen for Campaign Creation
  //   this.campaignContract.on('CampaignCreated', async (campaignId, ngoAddress, title, targetAmount, deadline, event) => {
  //     logger.info(`🎯 New Campaign Created: ${title} (ID: ${campaignId})`);
  //     await this.handleCampaignCreated(campaignId);
  //   });

  //   // Listen for Donations
  //   this.campaignContract.on('DonationReceived', async (campaignId, donor, amount, event) => {
  //     logger.info(`💰 Donation: ${ethers.formatEther(amount)} ETH to Campaign ${campaignId}`);
  //     await this.handleDonation(campaignId, donor, amount, event.log.blockNumber);
  //   });

  //   // Listen for Campaign Status Changes
  //   this.campaignContract.on('CampaignStatusChanged', async (campaignId, newStatus, event) => {
  //     logger.info(`📊 Campaign ${campaignId} status changed to ${newStatus}`);
  //     await this.handleCampaignStatusChange(campaignId, newStatus);
  //   });

  //   console.log('✅ Real-time event listeners active');
  // }

  // /**
  //  * Remove all event listeners
  //  */
  // removeEventListeners() {
  //   console.log('Removing event listeners...');
  //   this.ngoContract.removeAllListeners();
  //   this.campaignContract.removeAllListeners();
  // }

  async checkConnection() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`Connected to blockchain. Current block: ${blockNumber}`);
      return true;
    } catch (error) {
      console.error('Blockchain connection failed:', error);
      return false;
    }
  }

  async startPolling() {
    try {
      const connected = await this.checkConnection();
      if (!connected) {
        console.log('Retrying connection in 5 seconds...');
        setTimeout(() => this.startPolling(), 5000);
        return;
      }

      this.lastBlock = await this.provider.getBlockNumber();
      console.log(`Starting polling from block: ${this.lastBlock}`);
      this.isPolling = true;

      // Setup real-time event listeners
      // this.setupEventListeners();

      this.pollingInterval = setInterval(async () => {
        if (this.isPolling) {
          await this.pollNewBlocks();
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      console.error('Error starting polling:', error);
      setTimeout(() => this.startPolling(), 5000);
    }
  }

  async pollNewBlocks() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      if (currentBlock > this.lastBlock) {
        console.log(`Processing blocks ${this.lastBlock + 1} to ${currentBlock}`);
        
        for (let blockNumber = this.lastBlock + 1; blockNumber <= currentBlock; blockNumber++) {
          await this.processBlockEvents(blockNumber);
        }
        
        this.lastBlock = currentBlock;
      }
    } catch (error) {
      console.error('Error during polling:', error);
      // Don't stop polling on error, just log it
    }
  }

  async processBlockEvents(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber);
      
      if (block && block.transactions) {
        for (const txHash of block.transactions) {
          const receipt = await this.provider.getTransactionReceipt(txHash);
          
          if (receipt && receipt.logs) {
            for (const log of receipt.logs) {
              await this.processLog(log, blockNumber);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing block ${blockNumber}:`, error);
    }
  }

  async processLog(log, blockNumber) {
    try {
      // Parse NGO events
      const ngoInterface = this.ngoContract.interface;
      if (log.address.toLowerCase() === this.ngoContract.target.toLowerCase()) {
        try {
          const parsedLog = ngoInterface.parseLog(log);
          if (parsedLog) {
            console.log(`Processing NGO event: ${parsedLog.name} at block ${blockNumber}`);
            switch (parsedLog.name) {
              case 'NGOVerified':
                await this.updateNGOStatus(parsedLog.args.ngoId, 'verified');
                break;
              case 'NGOStatusChanged':
                const ngoStatusMap = ['pending', 'verified', 'rejected', 'suspended', 'blacklisted'];
                const newNgoStatus = ngoStatusMap[parsedLog.args.newStatus] || 'pending';
                await this.updateNGOStatus(parsedLog.args.ngoId, newNgoStatus);
                break;
              case 'NGORegistered':
                console.log(`New NGO registered: ID ${parsedLog.args.ngoId}, Address: ${parsedLog.args.ngoAddress}`);
                // You might want to sync the new NGO here
                break;
            }
          }
        } catch (parseError) {
          // Log might not be for our contract, ignore parsing errors
          if (!parseError.message.includes('no matching event')) {
            console.error('Error parsing NGO log:', parseError);
          }
        }
      }

      // Parse Campaign events
      const campaignInterface = this.campaignContract.interface;
      if (log.address.toLowerCase() === this.campaignContract.target.toLowerCase()) {
        try {
          const parsedLog = campaignInterface.parseLog(log);
          if (parsedLog) {
            console.log(`Processing Campaign event: ${parsedLog.name} at block ${blockNumber}`);
            switch (parsedLog.name) {
              case 'CampaignCreated':
                await this.syncCampaign(parsedLog.args.campaignId);
                break;
              case 'CampaignDonation':
              case 'DonationReceived':
                await this.updateCampaignRaisedAmount(parsedLog.args.campaignId);
                break;
              case 'CampaignStatusChanged':
                const campaignStatusMap = ['active', 'completed', 'cancelled', 'failed'];
                const newCampaignStatus = campaignStatusMap[parsedLog.args.newStatus] || 'active';
                await this.updateCampaignStatus(parsedLog.args.campaignId, newCampaignStatus);
                break;
              case 'CampaignCompleted':
                await this.updateCampaignStatus(parsedLog.args.campaignId, 'completed');
                await this.updateCampaignRaisedAmount(parsedLog.args.campaignId);
                break;
            }
          }
        } catch (parseError) {
          // Log might not be for our contract, ignore parsing errors
          if (!parseError.message.includes('no matching event')) {
            console.error('Error parsing Campaign log:', parseError);
          }
        }
      }

    // Add Service Provider events parsing
      const serviceProviderInterface = this.serviceProviderContract.interface;
      if (log.address.toLowerCase() === this.serviceProviderContract.target.toLowerCase()) {
        try {
          const parsedLog = serviceProviderInterface.parseLog(log);
          if (parsedLog) {
            console.log(`Processing Service Provider event: ${parsedLog.name} at block ${blockNumber}`);
            switch (parsedLog.name) {
              case 'ProviderVerified':
                await this.updateServiceProviderStatus(parsedLog.args.providerId, 'verified');
                break;
              case 'ProviderStatusChanged':
                const providerStatusMap = ['pending', 'verified', 'rejected', 'suspended'];
                const newProviderStatus = providerStatusMap[parsedLog.args.newStatus] || 'pending';
                await this.updateServiceProviderStatus(parsedLog.args.providerId, newProviderStatus);
                break;
              case 'ProviderRegistered':
                console.log(`New service provider registered: ID ${parsedLog.args.providerId}, Address: ${parsedLog.args.providerAddress}`);
                await this.syncServiceProvider(parsedLog.args.providerId);
                break;
              case 'RedemptionRecorded':
                console.log(`Redemption recorded for provider: ${parsedLog.args.providerId}, Amount: ${parsedLog.args.amount}`);
                await this.updateServiceProviderRedemptions(parsedLog.args.providerId);
                break;
            }
          }
        } catch (parseError) {
          // Log might not be for our contract, ignore parsing errors
          if (!parseError.message.includes('no matching event')) {
            console.error('Error parsing Service Provider log:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error processing log:', error);
    }
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Blockchain polling stopped');
    }
  }

  async updateNGOStatus(ngoId, status) {
    try {
      const ngo = await NGO.findOneAndUpdate(
        { ngoId: ngoId.toString() },
        { 
          status: status,
          verifiedAt: status === 'verified' ? new Date() : undefined,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (ngo) {
        console.log(`Updated NGO ${ngoId} status to ${status}`);
      } else {
        console.log(`NGO ${ngoId} not found in database`);
      }
    } catch (error) {
      logger.error(`Error updating NGO ${ngoId} status:`, error);
    }
  }

  async syncCampaign(campaignId) {
    try {
      const campaignData = await this.campaignContract.getCampaign(campaignId);
      const statusMap = ['active', 'completed', 'cancelled', 'failed'];
      
      // Find or create campaign in database
      const existingCampaign = await Campaign.findOne({ campaignId: campaignId.toString() });
      
      if (!existingCampaign) {
        // Get NGO details
        const ngo = await NGO.findOne({ address: campaignData.ngoAddress.toLowerCase() });
        
        if (ngo) {
          const newCampaign = new Campaign({
            campaignId: campaignId.toString(),
            ngoId: ngo.ngoId,
            ngoAddress: campaignData.ngoAddress.toLowerCase(),
            title: campaignData.title,
            description: campaignData.description,
            category: campaignData.category,
            targetAmount: campaignData.targetAmount.toString(),
            raisedAmount: campaignData.raisedAmount.toString(),
            startDate: new Date(Number(campaignData.startDate) * 1000),
            endDate: new Date(Number(campaignData.endDate) * 1000),
            documentsHash: campaignData.documentsHash,
            status: statusMap[campaignData.status] || 'active',
            totalDonors: Number(campaignData.totalDonors),
            createdAt: new Date(Number(campaignData.createdAt) * 1000),
          });

          await newCampaign.save();
          console.log(`Created new campaign ${campaignId} from blockchain event`);
        } else {
          console.log(`NGO not found for campaign ${campaignId}: ${campaignData.ngoAddress}`);
        }
      } else {
        console.log(`Campaign ${campaignId} already exists in database`);
      }
    } catch (error) {
      logger.error(`Error syncing campaign ${campaignId}:`, error);
    }
  }

  async updateCampaignStatus(campaignId, status) {
    try {
      const campaign = await Campaign.findOneAndUpdate(
        { campaignId: campaignId.toString() },
        { 
          status: status,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (campaign) {
        console.log(`Updated campaign ${campaignId} status to ${status}`);
      } else {
        console.log(`Campaign ${campaignId} not found in database`);
      }
    } catch (error) {
      logger.error(`Error updating campaign ${campaignId} status:`, error);
    }
  }

  async updateCampaignRaisedAmount(campaignId) {
    try {
      const campaignData = await this.campaignContract.getCampaign(campaignId);
      
      const campaign = await Campaign.findOneAndUpdate(
        { campaignId: campaignId.toString() },
        { 
          raisedAmount: campaignData.raisedAmount.toString(),
          totalDonors: Number(campaignData.totalDonors),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (campaign) {
        console.log(`Updated campaign ${campaignId} raised amount to ${campaignData.raisedAmount}`);
      } else {
        console.log(`Campaign ${campaignId} not found when updating raised amount`);
      }
    } catch (error) {
      logger.error(`Error updating campaign ${campaignId} raised amount:`, error);
    }
  }

  // Manual sync functions
  async syncNGO(ngoId) {
    try {
      const ngoData = await this.ngoContract.getNGOById(ngoId);
      const statusMap = ['pending', 'verified', 'rejected', 'suspended', 'blacklisted'];
      
      await NGO.findOneAndUpdate(
        { ngoId: ngoId.toString() },
        {
          status: statusMap[ngoData.status] || 'pending',
          verifiedAt: ngoData.verifiedAt > 0 ? new Date(ngoData.verifiedAt * 1000) : undefined,
          isActive: ngoData.isActive,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`Synced NGO ${ngoId} from blockchain`);
    } catch (error) {
      logger.error(`Error syncing NGO ${ngoId}:`, error);
    }
  }

  async syncAllCampaigns() {
    try {
      // This would need to be implemented based on your contract's ability to list all campaigns
      console.log('Manual campaign sync not yet implemented');
    } catch (error) {
      logger.error('Error syncing all campaigns:', error);
    }
  }

  // Add Service Provider sync methods
  async updateServiceProviderStatus(providerId, status) {
    try {
      const ServiceProvider = require('../models/ServiceProvider'); // Add this import at the top of file
      
      const provider = await ServiceProvider.findOneAndUpdate(
        { providerId: providerId.toString() },
        { 
          status: status,
          verifiedAt: status === 'verified' ? new Date() : undefined,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (provider) {
        console.log(`Updated service provider ${providerId} status to ${status}`);
      } else {
        console.log(`Service provider ${providerId} not found in database`);
      }
    } catch (error) {
      logger.error(`Error updating service provider ${providerId} status:`, error);
    }
  }

  async syncServiceProvider(providerId) {
    try {
      const ServiceProvider = require('../models/ServiceProvider'); // Add this import at the top
      
      const providerData = await this.serviceProviderContract.getProviderByAddress(
        await this.getProviderAddressById(providerId)
      );
      
      const statusMap = ['pending', 'verified', 'rejected', 'suspended'];
      
      // Find or create provider in database
      const existingProvider = await ServiceProvider.findOne({ providerId: providerId.toString() });
      
      if (!existingProvider) {
        const newProvider = new ServiceProvider({
          providerId: providerId.toString(),
          address: providerData.providerAddress.toLowerCase(),
          name: providerData.name,
          registrationNumber: providerData.registrationNumber,
          serviceType: providerData.serviceType,
          location: providerData.location,
          verificationDocHash: providerData.verificationDocHash,
          status: statusMap[providerData.status] || 'pending',
          totalRedemptions: Number(providerData.totalRedemptions),
          totalAmountRedeemed: Number(providerData.totalAmountRedeemed),
          isActive: providerData.isActive,
          registeredAt: new Date(Number(providerData.registeredAt) * 1000),
          verifiedAt: providerData.verifiedAt > 0 ? new Date(providerData.verifiedAt * 1000) : undefined,
        });

        await newProvider.save();
        console.log(`Created new service provider ${providerId} from blockchain event`);
      } else {
        console.log(`Service provider ${providerId} already exists in database`);
      }
    } catch (error) {
      logger.error(`Error syncing service provider ${providerId}:`, error);
    }
  }

  async updateServiceProviderRedemptions(providerId) {
    try {
      const ServiceProvider = require('../models/ServiceProvider'); // Add this import at the top
      
      const providerData = await this.serviceProviderContract.getProviderByAddress(
        await this.getProviderAddressById(providerId)
      );
      
      const provider = await ServiceProvider.findOneAndUpdate(
        { providerId: providerId.toString() },
        { 
          totalRedemptions: Number(providerData.totalRedemptions),
          totalAmountRedeemed: Number(providerData.totalAmountRedeemed),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (provider) {
        console.log(`Updated service provider ${providerId} redemptions: ${providerData.totalRedemptions}`);
      } else {
        console.log(`Service provider ${providerId} not found when updating redemptions`);
      }
    } catch (error) {
      logger.error(`Error updating service provider ${providerId} redemptions:`, error);
    }
  }

  // Helper method to get provider address by ID
  async getProviderAddressById(providerId) {
    // This would need a mapping in your contract, or you can iterate
    // For now, we'll get it from the database
    const ServiceProvider = require('../models/ServiceProvider');
    const provider = await ServiceProvider.findOne({ providerId: providerId.toString() });
    return provider ? provider.address : null;
  }

  // Add this method to your BlockchainSync class
  async handleTokenRedemption(tokenId, redeemerAddress, amount) {
    try {
      // Update service provider stats in database
      const ServiceProvider = require('../models/ServiceProvider');
      
      const provider = await ServiceProvider.findOne({ 
        address: redeemerAddress.toLowerCase() 
      });
      
      if (provider) {
        provider.totalRedemptions += 1;
        provider.totalAmountRedeemed += Number(amount);
        await provider.save();
        
        console.log(`Updated redemption stats for provider ${redeemerAddress}`);
      }
    } catch (error) {
      logger.error(`Error handling token redemption:`, error);
    }
  }

  // Manual sync function for service providers
  async syncServiceProviderByAddress(address) {
    try {
      const ServiceProvider = require('../models/ServiceProvider');
      
      const providerData = await this.serviceProviderContract.getProviderByAddress(address);
      const statusMap = ['pending', 'verified', 'rejected', 'suspended'];
      
      await ServiceProvider.findOneAndUpdate(
        { address: address.toLowerCase() },
        {
          status: statusMap[providerData.status] || 'pending',
          verifiedAt: providerData.verifiedAt > 0 ? new Date(providerData.verifiedAt * 1000) : undefined,
          isActive: providerData.isActive,
          totalRedemptions: Number(providerData.totalRedemptions),
          totalAmountRedeemed: Number(providerData.totalAmountRedeemed),
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`Synced service provider ${address} from blockchain`);
    } catch (error) {
      logger.error(`Error syncing service provider ${address}:`, error);
    }
  }

  // For backward compatibility
  async startListening() {
    console.log('Note: Using polling mode instead of event listeners');
    return this.startPolling();
  }
}

module.exports = BlockchainSync;