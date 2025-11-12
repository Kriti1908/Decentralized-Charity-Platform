const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const mongoose = require('mongoose');

// Campaign model (MongoDB)
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');

// Contract ABIs
// const CampaignFactoryABI = require('../../../frontend/lib/abi/CampaignFactory.json');
// const NGORegistryABI = require('../../../frontend/lib/abi/NGORegistry.json');

// Blockchain setup
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');
const campaignFactoryAddress = process.env.CONTRACT_ADDRESS_CAMPAIGN_FACTORY;
const ngoRegistryAddress = process.env.CONTRACT_ADDRESS_NGO_REGISTRY;

/**
 * @route   GET /api/campaigns
 * @desc    Get campaigns with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { ngoAddress, status, category, page = 1, limit = 10 } = req.query;

    // console.log('Received query:', { ngoAddress, status, category, page, limit }); // Add logging

    // Build query
    const query = {};
    if (ngoAddress) query.ngoAddress = ngoAddress.toLowerCase(); // Ensure lowercase
    if (status) query.status = status; // Don't parse to int if it's a string
    if (category) query.category = category;

    console.log('MongoDB query:', query); // Add logging

    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log(`Found ${campaigns.length} campaigns`); // Add logging

    const count = await Campaign.countDocuments(query);

    res.json({
      success: true,
      campaigns,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error('Error in campaigns route:', error); // Add detailed logging
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get campaign by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ campaignId: req.params.id });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get NGO details
    const ngo = await NGO.findOne({ address: campaign.ngoAddress });

    res.json({
      campaign,
      ngo: ngo ? {
        name: ngo.name,
        reputationScore: ngo.reputationScore,
        totalCampaigns: ngo.totalCampaigns,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      targetAmount,
      startDate,
      endDate,
      ngoAddress,
      documentsHash,
      images,
      transactionHash,
    } = req.body;

    console.log('Received campaign creation:', {
      title,
      category,
      targetAmount,
      ngoAddress,
      transactionHash
    });

    // Validate NGO exists and is verified
    const ngo = await NGO.findOne({ address: ngoAddress.toLowerCase() });
    console.log('NGO found:', ngo)
    if (!ngo) {
      console.log("NGO not found for address:", ngoAddress);
      return res.status(404).json({ error: 'NGO not found' });
    }

    if (ngo.status !== 'verified') {
      console.log("NGO is not verified:", ngo.status);
      return res.status(400).json({ error: 'NGO must be verified to create campaigns' });
    }

    // Create campaign in MongoDB first
    let campaignId;
    const campaignCount = await Campaign.countDocuments();    
    campaignId = campaignCount + 1;
    const campaign = new Campaign({
      campaignId,
      ngoId: ngo.ngoId,
      ngoAddress: ngoAddress.toLowerCase(),
      title,
      description,
      category,
      targetAmount,
      raisedAmount: '0',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      documentsHash: documentsHash || 'QmDefault',
      transactionHash,
      images: images || [],
      status: 'active',
    });

    await campaign.save();
    console.log('Campaign saved:', campaign._id);
    ngo.totalCampaigns += 1;
    await ngo.save();
    console.log('Campaign saved successfully:', campaign._id);

    // In a real implementation, you would use a wallet to call the blockchain
    // For now, we'll return the campaign data
    res.json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/campaigns/:id/donate
 * @desc    Process donation to campaign
 * @access  Public
 */
router.post('/:id/donate', async (req, res) => {
  try {
    const { id } = req.params;
    const { donorAddress, amount, transactionHash } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Record donation in MongoDB
    const donation = new Donation({
      campaignId: campaign._id,
      donorAddress,
      amount: ethers.parseEther(amount.toString()),
      transactionHash,
      donatedAt: new Date()
    });

    await donation.save();

    // Update campaign stats
    campaign.raisedAmount = (BigInt(campaign.raisedAmount) + ethers.parseEther(amount.toString())).toString();
    campaign.totalDonors += 1;

    await campaign.save();

    res.json({
      success: true,
      message: 'Donation recorded successfully',
      donation
    });
  } catch (error) {
    console.error('Error processing donation:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/campaigns/:id/donations
 * @desc    Get donations for a campaign
 * @access  Public
 */
router.get('/:id/donations', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find({ campaignId: id })
      .sort({ donatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments({ campaignId: id });

    res.json({
      success: true,
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;