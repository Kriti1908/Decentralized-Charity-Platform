const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

// Contract ABIs
const NGOGovernanceABI = require('../../../frontend/lib/abi/NGOGovernance.json');

// Get contract instances
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');
const governanceAddress = process.env.CONTRACT_ADDRESS_NGO_GOVERNANCE;

/**
 * @route   GET /api/governance/proposals
 * @desc    Get all active governance proposals
 * @access  Public
 */
router.get('/proposals', async (req, res) => {
  try {
    const governanceContract = new ethers.Contract(
      governanceAddress,
      NGOGovernanceABI,
      provider
    );

    const proposals = await governanceContract.getActiveProposals();
    
    const formattedProposals = proposals.map(proposal => ({
      proposalId: proposal.proposalId.toString(),
      ngoId: proposal.ngoId.toString(),
      proposer: proposal.proposer,
      description: proposal.description,
      votesFor: proposal.votesFor.toString(),
      votesAgainst: proposal.votesAgainst.toString(),
      startTime: Number(proposal.startTime),
      endTime: Number(proposal.endTime),
      executed: proposal.executed,
      proposalType: Number(proposal.proposalType)
    }));

    res.json({
      success: true,
      proposals: formattedProposals
    });
  } catch (error) {
    console.error('Error fetching governance proposals:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/governance/user/:address
 * @desc    Get user reputation and governance data
 * @access  Public
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid Ethereum address' 
      });
    }

    const governanceContract = new ethers.Contract(
      governanceAddress,
      NGOGovernanceABI,
      provider
    );

    const reputation = await governanceContract.getUserReputation(address);
    
    res.json({
      success: true,
      reputation: {
        totalVotes: reputation.totalVotes.toString(),
        successfulProposals: reputation.successfulProposals.toString(),
        reputationScore: Number(reputation.reputationScore),
        lastActivity: Number(reputation.lastActivity),
        isActive: reputation.isActive
      }
    });
  } catch (error) {
    console.error('Error fetching user reputation:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/governance/proposals/create
 * @desc    Create a new governance proposal
 * @access  Private
 */
router.post('/proposals/create', async (req, res) => {
  try {
    const { ngoId, description, proposalType, signature } = req.body;
    
    // In a real implementation, you would verify the signature
    // and use a wallet to submit the transaction
    
    res.json({
      success: true,
      message: 'Proposal creation would be handled by frontend with wallet connection',
      data: { ngoId, description, proposalType }
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;