const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const ServiceProvider = require('../models/ServiceProvider');

// Import the ABI correctly - extract just the abi array from the artifact
const SoulboundTokenArtifact = require('../../../frontend/lib/abi/SoulboundToken.json');
const SoulboundTokenABI = SoulboundTokenArtifact.abi;

// Get contract instances
const blockchainProvider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');
const soulboundTokenAddress = process.env.CONTRACT_ADDRESS_SOULBOUND_TOKEN;

/**
 * @route   GET /api/providers
 * @desc    Get all service providers
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { status, serviceType, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;

    const providers = await ServiceProvider.find(query)
      .sort({ registeredAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-verificationDocHash'); // Don't expose verification docs

    console.log(`Fetched ${providers.length} service providers`);

    const count = await ServiceProvider.countDocuments(query);

    res.json({
      providers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/providers/id/:id
 * @desc    Get service provider by blockchain ID
 * @access  Public
 */
router.get('/id/:id', async (req, res) => {
  try {
    const providerId = parseInt(req.params.id);
    
    const provider = await ServiceProvider.findOne({ providerId: providerId })
      .select('-verificationDocHash');

    if (!provider) {
      console.log('Service provider not found with ID:', providerId);
      return res.status(404).json({ error: 'Service provider not found' });
    }

    console.log('Service provider found:', provider);
    res.json({ provider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/providers/:address
 * @desc    Get service provider by address
 * @access  Public
 */
router.get('/:address', async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ 
      address: req.params.address.toLowerCase() 
    }).select('-verificationDocHash');

    if (!provider) {
      return res.status(404).json({ error: 'Service provider not found' });
    }

    res.json({ provider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/providers/register
 * @desc    Register new service provider (after blockchain registration)
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const {
      providerId,
      address,
      name,
      registrationNumber,
      serviceType,
      location,
      contactInfo,
      verificationDocHash,
      transactionHash,
    } = req.body;

    console.log('Received service provider registration:', {
      address,
      name,
      serviceType,
      location,
      transactionHash
    });

    // Check if provider already exists
    const existing = await ServiceProvider.findOne({ 
      $or: [
        { address: address.toLowerCase() },
        { registrationNumber: registrationNumber }
      ]
    });
    
    if (existing) {
      console.log('Service provider already exists:', existing);
      return res.status(400).json({ error: 'Service provider already registered' });
    }

    // Generate providerId if not provided
    const nextProviderId = providerId || (await ServiceProvider.countDocuments() + 1);

    const provider = new ServiceProvider({
      providerId: nextProviderId,
      address: address.toLowerCase(),
      name,
      registrationNumber,
      serviceType,
      location,
      contactInfo,
      verificationDocHash: verificationDocHash || req.body.documentHash,
      status: 'pending',
      transactionHash,
    });

    await provider.save();
    console.log('Service provider saved successfully:', provider._id);

    res.status(201).json({ 
      success: true,
      provider: {
        providerId: provider.providerId,
        address: provider.address,
        name: provider.name,
        serviceType: provider.serviceType,
        status: provider.status
      }
    });
  } catch (error) {
    console.error('Error registering service provider:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   PUT /api/providers/:address
 * @desc    Update service provider profile
 * @access  Private
 */
router.put('/:address', async (req, res) => {
  try {
    const provider = await ServiceProvider.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).select('-verificationDocHash');

    if (!provider) {
      return res.status(404).json({ error: 'Service provider not found' });
    }

    res.json({ provider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/providers/:address/sync
 * @desc    Sync service provider status from blockchain
 * @access  Public
 */
router.post('/:address/sync', async (req, res) => {
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    
    const serviceProviderContract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS_SERVICE_PROVIDER_REGISTRY,
      [
        'function getProviderByAddress(address) view returns (tuple(uint256 providerId, address providerAddress, string name, string registrationNumber, string serviceType, string location, string verificationDocHash, uint256 registeredAt, uint256 verifiedAt, uint8 status, uint256 totalRedemptions, uint256 totalAmountRedeemed, bool isActive))',
        'function addressToProviderId(address) view returns (uint256)'
      ],
      provider
    );

    const providerId = await serviceProviderContract.addressToProviderId(req.params.address);
    
    if (providerId === 0n) {
      return res.status(404).json({ error: 'Service provider not found on blockchain' });
    }

    const providerData = await serviceProviderContract.getProviderByAddress(req.params.address);
    const statusMap = ['pending', 'verified', 'rejected', 'suspended'];

    const updatedProvider = await ServiceProvider.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      {
        status: statusMap[providerData.status] || 'pending',
        verifiedAt: providerData.verifiedAt > 0 ? new Date(providerData.verifiedAt * 1000) : undefined,
        isActive: providerData.isActive,
        totalRedemptions: Number(providerData.totalRedemptions),
        totalAmountRedeemed: Number(providerData.totalAmountRedeemed),
        updatedAt: new Date()
      },
      { new: true }
    ).select('-verificationDocHash');

    if (!updatedProvider) {
      return res.status(404).json({ error: 'Service provider not found in database' });
    }

    res.json({ 
      success: true, 
      provider: updatedProvider,
      syncedFrom: 'blockchain'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/providers/:address/record-redemption
 * @desc    Record a token redemption (called by admin)
 * @access  Private
 */
router.post('/:address/record-redemption', async (req, res) => {
  try {
    const { amount } = req.body;
    
    const provider = await ServiceProvider.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      { 
        $inc: { 
          totalRedemptions: 1,
          totalAmountRedeemed: amount 
        },
        updatedAt: new Date()
      },
      { new: true }
    ).select('-verificationDocHash');

    if (!provider) {
      return res.status(404).json({ error: 'Service provider not found' });
    }

    res.json({ 
      success: true, 
      provider,
      message: `Redemption recorded: ${amount} for ${provider.name}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/providers/:address/tokens
 * @desc    Get all redeemable tokens for a service provider
 * @access  Public
 */
router.get('/:address/tokens', async (req, res) => {
  try {
    console.log('🔍 Fetching redeemable tokens for service provider:', req.params.address);
    const providerAddress = req.params.address.toLowerCase();
    
    // First, verify the service provider exists and is verified
    const provider = await ServiceProvider.findOne({ 
      address: providerAddress,
      status: 'verified'
    });

    if (!provider) {
      return res.status(404).json({ 
        success: false,
        error: 'Service provider not found or not verified' 
      });
    }

    // Check if contract address is configured
    if (!soulboundTokenAddress) {
      console.error('Soulbound Token contract address not configured');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: Contract address not set' 
      });
    }

    // Create contract instance using the ABI
    const soulboundTokenContract = new ethers.Contract(
      soulboundTokenAddress,
      SoulboundTokenABI,
      blockchainProvider
    );

    console.log(`🔍 Fetching redeemable tokens for provider: ${providerAddress}`);
    console.log(`📋 Service type: ${provider.serviceType}`);

    // Get total tokens
    const totalSupply = await soulboundTokenContract.totalSupply();
    console.log(`📦 Total tokens in contract: ${totalSupply}`);

    const redeemableTokens = [];

    // Iterate through all tokens to find redeemable ones for this provider
    for (let i = 0; i < totalSupply; i++) {
      try {
        const tokenId = await soulboundTokenContract.tokenByIndex(i);
        const metadata = await soulboundTokenContract.getTokenMetadata(tokenId);
        
        // Check if token matches provider's service type and is redeemable
        const isRedeemable = await soulboundTokenContract.isTokenRedeemable(tokenId);
        console.log("metadat service type: ",metadata.serviceType);
        console.log("provider service type: ",provider.serviceType);

        console.log("metadata: ",metadata);
        
        if (metadata.serviceType === provider.serviceType && isRedeemable) {
          redeemableTokens.push({
            tokenId: tokenId.toString(),
            campaignId: metadata.campaignId.toString(),
            beneficiary: metadata.beneficiary,
            entitledAmount: metadata.entitledAmount.toString(),
            serviceType: metadata.serviceType,
            issuedAt: Number(metadata.issuedAt.toString()),
            validUntil: Number(metadata.expiryDate.toString()),
            isRedeemed: metadata.isRedeemed,
            redeemedBy: metadata.redeemedBy,
            redeemedAt: metadata.redeemedAt ? Number(metadata.redeemedAt.toString()) : 0,
            proofOfServiceHash: metadata.proofOfServiceHash,
            status: Number(metadata.status.toString())
          });
        }
      } catch (error) {
        console.error(`❌ Error processing token ${i}:`, error);
        // Continue with next token
      }
    }

    console.log(`✅ Found ${redeemableTokens.length} redeemable tokens for provider ${providerAddress}`);

    res.json({
      success: true,
      provider: {
        name: provider.name,
        serviceType: provider.serviceType,
        address: provider.address
      },
      tokens: redeemableTokens
    });
  } catch (error) {
    console.error('❌ Error fetching provider tokens:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;