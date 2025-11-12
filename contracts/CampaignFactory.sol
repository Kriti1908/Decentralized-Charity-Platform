// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SoulboundToken.sol";
import "./NGORegistry.sol";

/**
 * @title CampaignFactory
 * @notice Factory contract for creating and managing charity campaigns
 * @dev Handles campaign lifecycle, milestones, and fund distribution
 */
contract CampaignFactory is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum CampaignStatus {
        Draft,
        Active,
        Paused,
        Completed,
        Cancelled
    }

    enum MilestoneStatus {
        Pending,
        InProgress,
        Completed,
        Failed
    }

    struct Milestone {
        string description;
        uint256 targetAmount;
        uint256 deadline;
        MilestoneStatus status;
        string proofHash; // IPFS hash of proof documents
        uint256 completedAt;
    }

    struct Campaign {
        uint256 campaignId;
        address ngoAddress;
        uint256 ngoId;
        string title;
        string description;
        string category;
        uint256 targetAmount;
        uint256 raisedAmount;
        uint256 startDate;
        uint256 endDate;
        CampaignStatus status;
        uint256 totalDonors;
        uint256 totalBeneficiaries;
        string documentsHash; // IPFS hash of campaign documents
        bool hasMilestones;
        uint256 createdAt;
    }

    // Campaign ID counter
    uint256 private _campaignIdCounter;

    // Reference to NGO Registry
    NGORegistry public ngoRegistry;

    // Reference to Soulbound Token contract
    SoulboundToken public soulboundToken;

    // Mapping from campaign ID to campaign data
    mapping(uint256 => Campaign) public campaigns;

    // Mapping from campaign ID to milestones
    mapping(uint256 => Milestone[]) public campaignMilestones;

    // Mapping from campaign ID to donor addresses
    mapping(uint256 => address[]) public campaignDonors;

    // Mapping from campaign ID to donor amount
    mapping(uint256 => mapping(address => uint256)) public campaignDonations;

    // Mapping from campaign ID to funds held
    mapping(uint256 => uint256) public campaignFunds;

    // Platform fee percentage (in basis points, 100 = 1%)
    uint256 public platformFeePercentage = 250; // 2.5%

    // Platform fee collector address
    address public feeCollector;

    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed ngo,
        string title,
        uint256 targetAmount
    );

    event CampaignStatusChanged(
        uint256 indexed campaignId,
        CampaignStatus oldStatus,
        CampaignStatus newStatus
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    event MilestoneAdded(uint256 indexed campaignId, uint256 milestoneIndex, string description);

    event MilestoneCompleted(uint256 indexed campaignId, uint256 milestoneIndex);

    event FundsReleased(uint256 indexed campaignId, uint256 amount, address recipient);

    event BeneficiaryTokenIssued(
        uint256 indexed campaignId,
        address indexed beneficiary,
        uint256 tokenId
    );

    constructor(address _ngoRegistry, address _soulboundToken, address _feeCollector) {
        require(_ngoRegistry != address(0), "Invalid NGO Registry address");
        require(_soulboundToken != address(0), "Invalid Soulbound Token address");
        require(_feeCollector != address(0), "Invalid fee collector address");

        ngoRegistry = NGORegistry(_ngoRegistry);
        soulboundToken = SoulboundToken(_soulboundToken);
        feeCollector = _feeCollector;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create a new campaign
     * @param title Campaign title
     * @param description Campaign description
     * @param category Campaign category
     * @param targetAmount Target fundraising amount
     * @param duration Campaign duration in seconds
     * @param documentsHash IPFS hash of campaign documents
     */
    function createCampaign(
        string memory title,
        string memory description,
        string memory category,
        uint256 targetAmount,
        uint256 duration,
        string memory documentsHash
    ) external whenNotPaused returns (uint256) {
        require(ngoRegistry.isNGOVerified(msg.sender), "Only verified NGOs can create campaigns");
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        uint256 campaignId = ++_campaignIdCounter;
        uint256 ngoId = ngoRegistry.addressToNgoId(msg.sender);

        campaigns[campaignId] = Campaign({
            campaignId: campaignId,
            ngoAddress: msg.sender,
            ngoId: ngoId,
            title: title,
            description: description,
            category: category,
            targetAmount: targetAmount,
            raisedAmount: 0,
            startDate: block.timestamp,
            endDate: block.timestamp + duration,
            status: CampaignStatus.Active,
            totalDonors: 0,
            totalBeneficiaries: 0,
            documentsHash: documentsHash,
            hasMilestones: false,
            createdAt: block.timestamp
        });

        emit CampaignCreated(campaignId, msg.sender, title, targetAmount);

        return campaignId;
    }

    /**
     * @notice Add milestone to campaign
     * @param campaignId ID of the campaign
     * @param description Milestone description
     * @param targetAmount Target amount for this milestone
     * @param deadline Milestone deadline
     */
    function addMilestone(
        uint256 campaignId,
        string memory description,
        uint256 targetAmount,
        uint256 deadline
    ) external {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignId != 0, "Campaign does not exist");
        require(campaign.ngoAddress == msg.sender, "Only campaign creator can add milestones");
        require(campaign.status == CampaignStatus.Draft || campaign.status == CampaignStatus.Active, "Cannot modify campaign");

        campaignMilestones[campaignId].push(Milestone({
            description: description,
            targetAmount: targetAmount,
            deadline: deadline,
            status: MilestoneStatus.Pending,
            proofHash: "",
            completedAt: 0
        }));

        campaign.hasMilestones = true;

        emit MilestoneAdded(campaignId, campaignMilestones[campaignId].length - 1, description);
    }

    /**
     * @notice Donate to a campaign
     * @param campaignId ID of the campaign
     */
    function donate(uint256 campaignId) external payable nonReentrant whenNotPaused {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignId != 0, "Campaign does not exist");
        require(campaign.status == CampaignStatus.Active, "Campaign is not active");
        require(block.timestamp <= campaign.endDate, "Campaign has ended");
        require(msg.value > 0, "Donation amount must be greater than 0");

        // Record donation
        if (campaignDonations[campaignId][msg.sender] == 0) {
            campaignDonors[campaignId].push(msg.sender);
            campaign.totalDonors++;
        }

        campaignDonations[campaignId][msg.sender] += msg.value;
        campaign.raisedAmount += msg.value;
        campaignFunds[campaignId] += msg.value;

        emit DonationReceived(campaignId, msg.sender, msg.value);

        // Auto-complete if target reached
        if (campaign.raisedAmount >= campaign.targetAmount) {
            _updateCampaignStatus(campaignId, CampaignStatus.Completed);
        }
    }

    /**
     * @notice Issue beneficiary token
     * @param campaignId ID of the campaign
     * @param beneficiary Address of the beneficiary
     * @param entitledAmount Amount entitled to beneficiary
     * @param serviceType Type of service
     * @param validityPeriod Token validity period
     */
    function issueBeneficiaryToken(
        uint256 campaignId,
        address beneficiary,
        uint256 entitledAmount,
        string memory serviceType,
        uint256 validityPeriod
    ) external nonReentrant returns (uint256) {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignId != 0, "Campaign does not exist");
        require(campaign.ngoAddress == msg.sender, "Only campaign creator can issue tokens");
        require(campaign.status == CampaignStatus.Active, "Campaign must be active");
        require(campaignFunds[campaignId] >= entitledAmount, "Insufficient campaign funds");
        require(entitledAmount > 0, "Entitled amount must be greater than 0");
        require(validityPeriod > 0, "Validity period must be greater than 0");

        // Mint soulbound token to beneficiary
        uint256 tokenId = soulboundToken.mintToken(
            beneficiary,
            campaignId,
            entitledAmount,
            serviceType,
            validityPeriod
        );

        campaign.totalBeneficiaries++;

        // Reserve funds for this token
        campaignFunds[campaignId] -= entitledAmount;

        emit BeneficiaryTokenIssued(campaignId, beneficiary, tokenId);

        return tokenId;
    }

    /**
     * @notice Release funds to service provider after token redemption
     * @param campaignId ID of the campaign
     * @param recipient Address to receive funds
     * @param amount Amount to release
     */
    function releaseFunds(
        uint256 campaignId,
        address payable recipient,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignId != 0, "Campaign does not exist");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");

        // Calculate platform fee
        uint256 fee = (amount * platformFeePercentage) / 10000;
        uint256 netAmount = amount - fee;

        // Transfer funds
        (bool successFee, ) = payable(feeCollector).call{value: fee}("");
        require(successFee, "Fee transfer failed");

        (bool successNet, ) = recipient.call{value: netAmount}("");
        require(successNet, "Fund transfer failed");

        emit FundsReleased(campaignId, netAmount, recipient);
    }

    /**
     * @notice Complete a milestone
     * @param campaignId ID of the campaign
     * @param milestoneIndex Index of the milestone
     * @param proofHash IPFS hash of completion proof
     */
    function completeMilestone(
        uint256 campaignId,
        uint256 milestoneIndex,
        string memory proofHash
    ) external {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignId != 0, "Campaign does not exist");
        require(campaign.ngoAddress == msg.sender, "Only campaign creator can complete milestones");
        require(milestoneIndex < campaignMilestones[campaignId].length, "Invalid milestone index");

        Milestone storage milestone = campaignMilestones[campaignId][milestoneIndex];
        require(milestone.status == MilestoneStatus.Pending || milestone.status == MilestoneStatus.InProgress, "Milestone cannot be completed");

        milestone.status = MilestoneStatus.Completed;
        milestone.proofHash = proofHash;
        milestone.completedAt = block.timestamp;

        emit MilestoneCompleted(campaignId, milestoneIndex);
    }

    /**
     * @notice Update campaign status
     */
    function _updateCampaignStatus(uint256 campaignId, CampaignStatus newStatus) internal {
        Campaign storage campaign = campaigns[campaignId];
        CampaignStatus oldStatus = campaign.status;
        campaign.status = newStatus;

        emit CampaignStatusChanged(campaignId, oldStatus, newStatus);
    }

    /**
     * @notice Pause a campaign
     * @param campaignId ID of the campaign
     */
    function pauseCampaign(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignId != 0, "Campaign does not exist");
        require(campaign.ngoAddress == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(campaign.status == CampaignStatus.Active, "Campaign is not active");

        _updateCampaignStatus(campaignId, CampaignStatus.Paused);
    }

    /**
     * @notice Resume a paused campaign
     * @param campaignId ID of the campaign
     */
    function resumeCampaign(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignId != 0, "Campaign does not exist");
        require(campaign.ngoAddress == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(campaign.status == CampaignStatus.Paused, "Campaign is not paused");

        _updateCampaignStatus(campaignId, CampaignStatus.Active);
    }

    /**
     * @notice Get campaign details
     * @param campaignId ID of the campaign
     */
    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        require(campaigns[campaignId].campaignId != 0, "Campaign does not exist");
        return campaigns[campaignId];
    }

    /**
     * @notice Get campaign milestones
     * @param campaignId ID of the campaign
     */
    function getCampaignMilestones(uint256 campaignId) external view returns (Milestone[] memory) {
        require(campaigns[campaignId].campaignId != 0, "Campaign does not exist");
        return campaignMilestones[campaignId];
    }

    /**
     * @notice Get campaign donors
     * @param campaignId ID of the campaign
     */
    function getCampaignDonors(uint256 campaignId) external view returns (address[] memory) {
        require(campaigns[campaignId].campaignId != 0, "Campaign does not exist");
        return campaignDonors[campaignId];
    }

    /**
     * @notice Get donor's donation amount for a campaign
     * @param campaignId ID of the campaign
     * @param donor Address of the donor
     */
    function getDonorAmount(uint256 campaignId, address donor) external view returns (uint256) {
        return campaignDonations[campaignId][donor];
    }

    /**
     * @notice Update platform fee
     * @param newFeePercentage New fee percentage in basis points
     */
    function updatePlatformFee(uint256 newFeePercentage) external onlyRole(ADMIN_ROLE) {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = newFeePercentage;
    }

    /**
     * @notice Update fee collector address
     * @param newFeeCollector New fee collector address
     */
    function updateFeeCollector(address newFeeCollector) external onlyRole(ADMIN_ROLE) {
        require(newFeeCollector != address(0), "Invalid address");
        feeCollector = newFeeCollector;
    }

    /**
     * @notice Get campaigns created by a specific NGO
     * @param ngoAddress Address of the NGO
     * @return Array of campaign IDs
     */
    function getCampaignsByNGO(address ngoAddress) external view returns (uint256[] memory) {
        // This is a simplified implementation - you might need to track this differently
        uint256[] memory ngoCampaigns = new uint256[](_campaignIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _campaignIdCounter; i++) {
            if (campaigns[i].ngoAddress == ngoAddress) {
                ngoCampaigns[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = ngoCampaigns[i];
        }
        
        return result;
    }

    /**
     * @notice Check if NGO can issue tokens for a campaign
     * @param campaignId ID of the campaign
     * @param ngoAddress Address of the NGO
     * @return True if NGO can issue tokens
     */
    function canIssueTokens(uint256 campaignId, address ngoAddress) external view returns (bool) {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.campaignId != 0 &&
            campaign.ngoAddress == ngoAddress &&
            campaign.status == CampaignStatus.Active &&
            campaignFunds[campaignId] > 0
        );
    }

    /**
     * @notice Get available funds for a campaign
     * @param campaignId ID of the campaign
     * @return Available funds amount
     */
    function getCampaignFunds(uint256 campaignId) external view returns (uint256) {
        require(campaigns[campaignId].campaignId != 0, "Campaign does not exist");
        return campaignFunds[campaignId];
    }

    /**
     * @notice Get total number of campaigns
     * @return Total campaign count
     */
    function getTotalCampaigns() external view returns (uint256) {
        return _campaignIdCounter;
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Receive function to accept ETH
    receive() external payable {}
}
