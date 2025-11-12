const express = require('express');
const router = express.Router();
const NGO = require('../models/NGO');

/**
 * @route   GET /api/ngos
 * @desc    Get all NGOs
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const ngos = await NGO.find(query)
      .sort({ reputationScore: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-kycDocumentHash'); // Don't expose KYC docs

    console.log(`Fetched ${ngos.length} NGOs`);

    const count = await NGO.countDocuments(query);

    res.json({
      ngos,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/ngos/id/:id
 * @desc    Get NGO by blockchain ID
 * @access  Public
 */
router.get('/id/:id', async (req, res) => {
  try {
    const ngoId = parseInt(req.params.id);
    
    const ngo = await NGO.findOne({ ngoId: ngoId })
      .select('-kycDocumentHash');

    if (!ngo) {
      console.log('NGO not found with ID:', ngoId);
      return res.status(404).json({ error: 'NGO not found' });
    }

    console.log('NGO found:', ngo);
    res.json({ ngo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/ngos/:address
 * @desc    Get NGO by address
 * @access  Public
 */
router.get('/:address', async (req, res) => {
  try {
    const ngo = await NGO.findOne({ address: req.params.address.toLowerCase() })
      .select('-kycDocumentHash');

    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    res.json({ ngo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/ngos/register
 * @desc    Register new NGO (after blockchain registration)
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const {
      ngoId,
      address,
      name,
      registrationNumber,
      country,
      category,
      description,
      website,
      email,
      phone,
      kycDocumentHash,
      transactionHash,
    } = req.body;

    console.log('Received NGO registration:', {
      address,
      name,
      country,
      category,
      transactionHash
    });

    // Check if NGO already exists
    const existing = await NGO.findOne({ 
      $or: [
        { address: address.toLowerCase() },
        { registrationNumber: registrationNumber }
      ]
    });
    
    if (existing) {
      console.log('NGO already exists:', existing);
      return res.status(400).json({ error: 'NGO already registered' });
    }

    // Generate ngoId if not provided (for backward compatibility)
    const nextNgoId = ngoId || (await NGO.countDocuments() + 1);

    const ngo = new NGO({
      ngoId: nextNgoId,
      address: address.toLowerCase(),
      name,
      registrationNumber,
      country,
      category,
      description,
      website,
      email: email || req.body.contactEmail, // Handle both email and contactEmail
      phone,
      kycDocumentHash: kycDocumentHash || req.body.documentHash, // Handle both field names
      status: 'pending', // Default status
      transactionHash,
    });

    await ngo.save();
    console.log('NGO saved successfully:', ngo._id);

    res.status(201).json({ 
      success: true,
      ngo: {
        ngoId: ngo.ngoId,
        address: ngo.address,
        name: ngo.name,
        status: ngo.status
      }
    });
  } catch (error) {
    console.error('Error registering NGO:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   PUT /api/ngos/:address
 * @desc    Update NGO profile
 * @access  Private
 */
router.put('/:address', async (req, res) => {
  try {
    const ngo = await NGO.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).select('-kycDocumentHash');

    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    res.json({ ngo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/ngos/:address/sync
 * @desc    Sync NGO status from blockchain
 * @access  Public
 */
router.post('/:address/sync', async (req, res) => {
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    
    const ngoContract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS_NGO_REGISTRY,
      [
        'function getNGOByAddress(address) view returns (tuple(uint256 ngoId, address ngoAddress, string name, string registrationNumber, string country, string category, string kycDocumentHash, uint256 registeredAt, uint256 verifiedAt, uint8 status, uint256 reputationScore, uint256 totalCampaigns, uint256 totalFundsRaised, uint256 totalBeneficiaries, bool isActive))',
        'function addressToNgoId(address) view returns (uint256)'
      ],
      provider
    );

    const ngoId = await ngoContract.addressToNgoId(req.params.address);
    
    if (ngoId === 0n) {
      return res.status(404).json({ error: 'NGO not found on blockchain' });
    }

    const ngoData = await ngoContract.getNGOByAddress(req.params.address);
    const statusMap = ['pending', 'verified', 'rejected', 'suspended', 'blacklisted'];

    const updatedNGO = await NGO.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      {
        status: statusMap[ngoData.status] || 'pending',
        verifiedAt: ngoData.verifiedAt > 0 ? new Date(ngoData.verifiedAt * 1000) : undefined,
        isActive: ngoData.isActive,
        reputationScore: Number(ngoData.reputationScore),
        totalCampaigns: Number(ngoData.totalCampaigns),
        totalFundsRaised: Number(ngoData.totalFundsRaised),
        totalBeneficiaries: Number(ngoData.totalBeneficiaries),
        updatedAt: new Date()
      },
      { new: true }
    ).select('-kycDocumentHash');

    if (!updatedNGO) {
      return res.status(404).json({ error: 'NGO not found in database' });
    }

    res.json({ 
      success: true, 
      ngo: updatedNGO,
      syncedFrom: 'blockchain'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
