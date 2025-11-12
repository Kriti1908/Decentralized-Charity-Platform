const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');

/**
 * @route   GET /api/donations
 * @desc    Get all donations with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      campaignId, 
      donorAddress, 
      status = 'confirmed',
      page = 1, 
      limit = 20 
    } = req.query;

    const query = { status };
    if (campaignId) query.campaignId = campaignId;
    if (donorAddress) query.donorAddress = donorAddress.toLowerCase();

    const donations = await Donation.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    const count = await Donation.countDocuments(query);

    res.json({
      success: true,
      donations,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch donations' 
    });
  }
});

/**
 * @route   GET /api/donations/:id
 * @desc    Get donation by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findOne({ donationId: req.params.id });
    
    if (!donation) {
      return res.status(404).json({ 
        success: false,
        error: 'Donation not found' 
      });
    }

    res.json({
      success: true,
      donation,
    });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch donation' 
    });
  }
});

/**
 * @route   POST /api/donations
 * @desc    Record a donation (called after blockchain transaction)
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      donationId,
      campaignId,
      donorAddress,
      amount,
      transactionHash,
      blockNumber,
      isAnonymous = false,
      message = '',
    } = req.body;

    console.log('Recording donation:', {
      donationId,
      campaignId,
      donorAddress,
      amount,
      transactionHash
    });

    // Check if donation already exists
    const existingDonation = await Donation.findOne({ 
      $or: [
        { donationId },
        { transactionHash }
      ]
    });

    if (existingDonation) {
      return res.status(400).json({ 
        success: false,
        error: 'Donation already recorded' 
      });
    }

    // Verify campaign exists
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        error: 'Campaign not found' 
      });
    }

    const donation = new Donation({
      donationId,
      campaignId,
      donorAddress: donorAddress.toLowerCase(),
      amount: amount.toString(),
      transactionHash,
      blockNumber: parseInt(blockNumber),
      isAnonymous,
      message,
      status: 'confirmed',
      timestamp: new Date(),
    });

    await donation.save();

    // Update campaign raised amount
    campaign.raisedAmount = (BigInt(campaign.raisedAmount) + BigInt(amount)).toString();
    
    // Count unique donors for this campaign
    const uniqueDonors = await Donation.distinct('donorAddress', { 
      campaignId, 
      status: 'confirmed' 
    });
    campaign.totalDonors = uniqueDonors.length;
    
    await campaign.save();

    console.log('Donation recorded successfully:', donation._id);

    res.status(201).json({ 
      success: true,
      donation: {
        donationId: donation.donationId,
        amount: donation.amount,
        campaignId: donation.campaignId,
        timestamp: donation.timestamp
      }
    });
  } catch (error) {
    console.error('Error recording donation:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/donations/campaign/:campaignId
 * @desc    Get all donations for a specific campaign
 * @access  Public
 */
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const donations = await Donation.find({ 
      campaignId: req.params.campaignId,
      status: 'confirmed'
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    const count = await Donation.countDocuments({ 
      campaignId: req.params.campaignId,
      status: 'confirmed'
    });

    res.json({
      success: true,
      donations,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch donations' 
    });
  }
});

/**
 * @route   GET /api/donations/donor/:donorAddress
 * @desc    Get donation history for a specific donor
 * @access  Public
 */
router.get('/donor/:donorAddress', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const donations = await Donation.find({ 
      donorAddress: req.params.donorAddress.toLowerCase(),
      status: 'confirmed'
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    const count = await Donation.countDocuments({ 
      donorAddress: req.params.donorAddress.toLowerCase(),
      status: 'confirmed'
    });

    // Get donor statistics
    const donorStats = await Donation.getDonorStats(req.params.donorAddress);

    res.json({
      success: true,
      donations,
      stats: {
        totalDonated: donorStats.totalDonated,
        totalDonations: donorStats.totalDonations,
        campaignsSupported: donorStats.campaignsSupported.length,
      },
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error('Error fetching donor history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch donor history' 
    });
  }
});

/**
 * @route   GET /api/donations/stats/:campaignId
 * @desc    Get donation statistics for a campaign
 * @access  Public
 */
router.get('/stats/:campaignId', async (req, res) => {
  try {
    const stats = await Donation.getTotalDonationsByCampaign(req.params.campaignId);

    res.json({
      success: true,
      stats: {
        totalAmount: stats.totalAmount,
        donationCount: stats.donationCount,
        uniqueDonors: stats.uniqueDonors.length,
      },
    });
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch donation statistics' 
    });
  }
});

/**
 * @route   POST /api/donations/:id/sync
 * @desc    Sync donation status from blockchain
 * @access  Public
 */
router.post('/:id/sync', async (req, res) => {
  try {
    const donation = await Donation.findOne({ donationId: req.params.id });
    
    if (!donation) {
      return res.status(404).json({ 
        success: false,
        error: 'Donation not found' 
      });
    }

    // In a real implementation, you would verify the transaction on-chain
    // For now, we'll assume confirmed donations stay confirmed
    res.json({ 
      success: true, 
      donation,
      synced: true
    });
  } catch (error) {
    console.error('Error syncing donation:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;