// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NGOGovernance
 * @notice Decentralized NGO verification through community voting
 */
contract NGOGovernance is AccessControl, ReentrancyGuard {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Voting parameters
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_REPUTATION_TO_VOTE = 100;
    uint256 public constant VOTE_WEIGHT_BASE = 100;
    uint256 public constant REPUTATION_CHANGE_PER_VOTE = 10;
    
    enum ProposalType { Verification, Challenge }
    enum VoteType { Upvote, Downvote }
    
    struct Proposal {
        uint256 proposalId;
        uint256 ngoId;
        ProposalType proposalType;
        address proposer;
        string description;
        string evidenceHash;
        uint256 startTime;
        uint256 endTime;
        uint256 upvotes;
        uint256 downvotes;
        uint256 totalVotingPower;
        bool executed;
        mapping(address => Vote) votes;
    }
    
    struct Vote {
        bool hasVoted;
        VoteType voteType;
        uint256 votingPower;
        uint256 reputationStake;
    }
    
    struct UserReputation {
        uint256 score;
        uint256 totalProposals;
        uint256 successfulVerifications;
        uint256 successfulChallenges;
        uint256 lastActivity;
    }

    struct ProposalView {
        uint256 proposalId;
        uint256 ngoId;
        ProposalType proposalType;
        address proposer;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 upvotes;
        uint256 downvotes;
        bool executed;
    }
    
    // Mappings
    mapping(uint256 => Proposal) public proposals;
    mapping(address => UserReputation) public userReputations;
    mapping(uint256 => uint256) public ngoVerificationProposals;
    mapping(uint256 => uint256[]) public ngoChallenges;
    mapping(address => bool) public hasVotedOnProposal;
    
    // Arrays for iteration
    uint256[] public allProposalIds;
    
    // Counters
    uint256 private _proposalIdCounter;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed ngoId,
        ProposalType proposalType,
        address indexed proposer,
        string description
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType,
        uint256 votingPower
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool verified,
        string reason
    );
    
    event ReputationUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore
    );
    
    event NGOChallenged(
        uint256 indexed ngoId,
        uint256 indexed proposalId,
        address indexed challenger
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create a verification proposal for an NGO
     */
    function createVerificationProposal(
        uint256 ngoId,
        string memory description,
        string memory evidenceHash
    ) external nonReentrant returns (uint256) {
        require(ngoVerificationProposals[ngoId] == 0, "Proposal already exists");
        require(userReputations[msg.sender].score >= MIN_REPUTATION_TO_VOTE, "Insufficient reputation");
        
        uint256 proposalId = ++_proposalIdCounter;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.proposalId = proposalId;
        proposal.ngoId = ngoId;
        proposal.proposalType = ProposalType.Verification;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.evidenceHash = evidenceHash;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_DURATION;
        
        ngoVerificationProposals[ngoId] = proposalId;
        
        // Proposer automatically upvotes
        _castVote(proposalId, VoteType.Upvote, msg.sender);
        
        emit ProposalCreated(proposalId, ngoId, ProposalType.Verification, msg.sender, description);
        return proposalId;
    }

    /**
     * @notice Challenge a verified NGO
     */
    function challengeNGO(
        uint256 ngoId,
        string memory description,
        string memory evidenceHash
    ) external nonReentrant returns (uint256) {
        require(userReputations[msg.sender].score >= MIN_REPUTATION_TO_VOTE, "Insufficient reputation");
        
        uint256 proposalId = ++_proposalIdCounter;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.proposalId = proposalId;
        proposal.ngoId = ngoId;
        proposal.proposalType = ProposalType.Challenge;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.evidenceHash = evidenceHash;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_DURATION;
        
        ngoChallenges[ngoId].push(proposalId);
        
        // Proposer automatically downvotes
        _castVote(proposalId, VoteType.Downvote, msg.sender);
        
        emit ProposalCreated(proposalId, ngoId, ProposalType.Challenge, msg.sender, description);
        emit NGOChallenged(ngoId, proposalId, msg.sender);
        
        return proposalId;
    }

    /**
     * @notice Cast vote on a proposal
     */
    function castVote(uint256 proposalId, VoteType voteType) external nonReentrant {
        require(userReputations[msg.sender].score >= MIN_REPUTATION_TO_VOTE, "Insufficient reputation");
        _castVote(proposalId, voteType, msg.sender);
    }

    function _castVote(uint256 proposalId, VoteType voteType, address voter) internal {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.votes[voter].hasVoted, "Already voted");
        
        uint256 votingPower = _calculateVotingPower(voter);
        
        proposal.votes[voter] = Vote({
            hasVoted: true,
            voteType: voteType,
            votingPower: votingPower,
            reputationStake: REPUTATION_CHANGE_PER_VOTE
        });
        
        if (voteType == VoteType.Upvote) {
            proposal.upvotes += votingPower;
        } else {
            proposal.downvotes += votingPower;
        }
        
        proposal.totalVotingPower += votingPower;
        
        emit VoteCast(proposalId, voter, voteType, votingPower);
    }

    /**
     * @notice Execute proposal after voting ends
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        
        proposal.executed = true;
        
        bool passed = proposal.upvotes > proposal.downvotes;
        string memory reason = passed ? "Proposal passed" : "Proposal rejected";
        
        if (passed) {
            if (proposal.proposalType == ProposalType.Verification) {
                _updateReputationForSuccess(proposalId, true);
            } else {
                _updateReputationForSuccess(proposalId, false);
            }
        } else {
            _updateReputationForFailure(proposalId);
        }
        
        emit ProposalExecuted(proposalId, passed, reason);
    }

    function _calculateVotingPower(address voter) internal view returns (uint256) {
        UserReputation memory rep = userReputations[voter];
        return (rep.score * VOTE_WEIGHT_BASE) / 1000; // Scale reputation to voting power
    }

    function _updateReputationForSuccess(uint256 proposalId, bool isVerification) internal {
        Proposal storage proposal = proposals[proposalId];
        
        // Update proposer reputation
        userReputations[proposal.proposer].score += REPUTATION_CHANGE_PER_VOTE * 2;
        userReputations[proposal.proposer].successfulVerifications += isVerification ? 1 : 0;
        userReputations[proposal.proposer].successfulChallenges += isVerification ? 0 : 1;
        
        // Update voters reputation
        for (uint256 i = 0; i < proposal.totalVotingPower; i++) {
            // In real implementation, you'd iterate through voters
            // This is simplified - you'd need to track voters separately
        }
    }

    function _updateReputationForFailure(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        
        // Penalize proposer for failed proposal
        if (userReputations[proposal.proposer].score > REPUTATION_CHANGE_PER_VOTE) {
            userReputations[proposal.proposer].score -= REPUTATION_CHANGE_PER_VOTE;
        }
    }

    /**
     * @notice Initialize reputation for new user
     */
    function initializeReputation(address user) external onlyRole(ADMIN_ROLE) {
        require(userReputations[user].score == 0, "Reputation already initialized");
        userReputations[user] = UserReputation({
            score: 500, // Start with base reputation
            totalProposals: 0,
            successfulVerifications: 0,
            successfulChallenges: 0,
            lastActivity: block.timestamp
        });
    }

    /**
     * @notice Update NGO Registry address (called by NGORegistry during deployment)
     */
    function updateNgoRegistry(address _ngoRegistry) external onlyRole(ADMIN_ROLE) {
        require(_ngoRegistry != address(0), "Invalid NGO registry address");
        // This function allows NGORegistry to register itself with governance
        // In a full implementation, you might want to store this reference
    }

    // View functions
    /**
     * @notice Get proposal details in a view-friendly format
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 ngoId,
        ProposalType proposalType,
        address proposer,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 upvotes,
        uint256 downvotes,
        bool executed
    ) {
        Proposal storage p = proposals[proposalId];
        return (
            p.ngoId,
            p.proposalType,
            p.proposer,
            p.description,
            p.startTime,
            p.endTime,
            p.upvotes,
            p.downvotes,
            p.executed
        );
    }

    /**
     * @notice Get all proposal IDs for iteration
     */
    function getAllProposalIds() external view returns (uint256[] memory) {
        return allProposalIds;
    }

    /**
     * @notice Get user reputation details
     */
    function getUserReputation(address user) external view returns (
        uint256 score,
        uint256 totalProposals,
        uint256 successfulVerifications,
        uint256 successfulChallenges,
        uint256 lastActivity
    ) {
        UserReputation memory rep = userReputations[user];
        return (
            rep.score,
            rep.totalProposals,
            rep.successfulVerifications,
            rep.successfulChallenges,
            rep.lastActivity
        );
    }

    /**
     * @notice Check if user can vote on proposal
     */
    function canVote(address user, uint256 proposalId) external view returns (bool) {
        if (userReputations[user].score < MIN_REPUTATION_TO_VOTE) return false;
        if (proposals[proposalId].executed) return false;
        if (block.timestamp > proposals[proposalId].endTime) return false;
        if (proposals[proposalId].votes[user].hasVoted) return false;
        return true;
    }
}