const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

// Import the ABI correctly - extract just the abi array from the artifact
const SoulboundTokenArtifact = require('../../../frontend/lib/abi/SoulboundToken.json');
const SoulboundTokenABI = SoulboundTokenArtifact.abi;

// Get contract instances
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');
const soulboundTokenAddress = process.env.CONTRACT_ADDRESS_SOULBOUND_TOKEN;

// Validate environment variables on startup
if (!soulboundTokenAddress) {
  console.error('❌ CONTRACT_ADDRESS_SOULBOUND_TOKEN is not set in environment variables');
}

console.log('🔧 Contract Configuration:', {
  address: soulboundTokenAddress,
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
  abiLength: SoulboundTokenABI ? SoulboundTokenABI.length : 'undefined'
});

/**
 * @route   GET /api/beneficiaries/:address/tokens
 * @desc    Get all tokens for a beneficiary address
 * @access  Public
 */
router.get('/:address/tokens', async (req, res) => {
  try {
    console.log("🔍 Received request for beneficiary tokens:", {
      address: req.params.address,
      contractAddress: soulboundTokenAddress,
      timestamp: new Date().toISOString()
    });

    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Check if contract address is configured
    if (!soulboundTokenAddress) {
      console.error('Contract address not configured');
      return res.status(500).json({ 
        error: 'Server configuration error: Contract address not set' 
      });
    }

    if (!ethers.isAddress(soulboundTokenAddress)) {
      console.error('Invalid contract address:', soulboundTokenAddress);
      return res.status(500).json({ 
        error: 'Server configuration error: Invalid contract address' 
      });
    }

    // Check if ABI is loaded correctly
    if (!SoulboundTokenABI || !Array.isArray(SoulboundTokenABI)) {
      console.error('ABI not loaded correctly:', SoulboundTokenABI);
      return res.status(500).json({ 
        error: 'Server configuration error: ABI not loaded correctly' 
      });
    }

    console.log(`📋 Creating contract instance with address: ${soulboundTokenAddress}`);
    console.log(`📄 ABI loaded with ${SoulboundTokenABI.length} entries`);

    const sbtContract = new ethers.Contract(
      soulboundTokenAddress,
      SoulboundTokenABI,
      provider
    );

    // Get all tokens for this beneficiary
    console.log(`🔎 Fetching tokens for beneficiary: ${address}`);
    const tokenIds = await sbtContract.getBeneficiaryTokens(address);
    console.log(`📦 Found ${tokenIds.length} tokens for beneficiary ${address}`);

    // Get metadata for each token
    const tokens = await Promise.all(
      tokenIds.map(async (tokenId) => {
        try {
          console.log(`📄 Fetching metadata for token ${tokenId}`);
          const metadata = await sbtContract.getTokenMetadata(tokenId);
          
          // Convert all BigInt values to strings/numbers
          return {
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
            status: Number(metadata.status.toString()) // Convert enum to number
          };
        } catch (error) {
          console.error(`❌ Error fetching metadata for token ${tokenId}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and return
    const validTokens = tokens.filter(token => token !== null);
    console.log(`✅ Successfully processed ${validTokens.length} valid tokens`);

    res.json({
      beneficiary: address,
      totalTokens: validTokens.length,
      tokens: validTokens,
    });
  } catch (error) {
    console.error('❌ Error fetching beneficiary tokens:', error);
    res.status(500).json({ 
      error: 'Failed to fetch beneficiary tokens',
      details: error.message 
    });
  }
});

module.exports = router;

/**
 * @route   GET /api/beneficiaries/:address/stats
 * @desc    Get statistics for a beneficiary
 * @access  Public
 */
router.get('/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const sbtContract = new ethers.Contract(
      soulboundTokenAddress,
      SoulboundTokenABI,
      provider
    );

    const tokenIds = await sbtContract.getBeneficiaryTokens(address);
    
    let totalAmount = BigInt(0);
    let redeemedCount = 0;
    let activeCount = 0;
    let expiredCount = 0;
    const currentTime = Math.floor(Date.now() / 1000);

    for (const tokenId of tokenIds) {
      try {
        const metadata = await sbtContract.getTokenMetadata(tokenId);
        totalAmount += BigInt(metadata.entitledAmount.toString());
        
        if (metadata.isRedeemed) {
          redeemedCount++;
        } else if (Number(metadata.expiryDate) < currentTime) {
          expiredCount++;
        } else {
          activeCount++;
        }
      } catch (error) {
        console.error(`Error processing token ${tokenId}:`, error);
      }
    }

    res.json({
      beneficiary: address,
      totalTokens: tokenIds.length,
      totalAmount: ethers.formatEther(totalAmount),
      activeTokens: activeCount,
      redeemedTokens: redeemedCount,
      expiredTokens: expiredCount,
    });
  } catch (error) {
    console.error('Error fetching beneficiary stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/beneficiaries/:address/tokens/:tokenId
 * @desc    Get specific token details
 * @access  Public
 */
router.get('/:address/tokens/:tokenId', async (req, res) => {
  try {
    const { address, tokenId } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const sbtContract = new ethers.Contract(
      soulboundTokenAddress,
      SoulboundTokenABI,
      provider
    );

    const metadata = await sbtContract.getTokenMetadata(BigInt(tokenId));

    // Verify this token belongs to the beneficiary
    if (metadata.beneficiary.toLowerCase() !== address.toLowerCase()) {
      return res.status(404).json({ error: 'Token not found for this beneficiary' });
    }

    res.json({
      tokenId,
      campaignId: metadata.campaignId.toString(),
      beneficiary: metadata.beneficiary,
      entitledAmount: metadata.entitledAmount.toString(),
      serviceType: metadata.serviceType,
      issuedAt: Number(metadata.issuedAt),
      validUntil: Number(metadata.expiryDate),
      isRedeemed: metadata.isRedeemed,
      redeemedBy: metadata.redeemedBy,
      redeemedAt: Number(metadata.redeemedAt),
      proofOfServiceHash: metadata.proofOfServiceHash,
      status: metadata.status
    });
  } catch (error) {
    console.error('Error fetching token details:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;