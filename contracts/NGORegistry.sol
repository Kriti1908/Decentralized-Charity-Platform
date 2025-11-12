// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./NGOGovernance.sol";

/**
 * @title NGORegistry
 * @notice Registry for NGO verification and management with decentralized governance
 * @dev Manages NGO registration, KYC verification, and reputation with community voting
 */
contract NGORegistry is AccessControl, Pausable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum NGOStatus {
        Pending,
        Verified,
        Rejected,
        Suspended,
        Blacklisted
    }

    struct NGO {
        uint256 ngoId;
        address ngoAddress;
        string name;
        string registrationNumber;
        string country;
        string category;
        string kycDocumentHash;
        uint256 registeredAt;
        uint256 verifiedAt;
        NGOStatus status;
        uint256 reputationScore;
        uint256 totalCampaigns;
        uint256 totalFundsRaised;
        uint256 totalBeneficiaries;
        bool isActive;
    }

    // NGO ID counter
    uint256 private _ngoIdCounter;

    // Mapping from NGO address to NGO ID
    mapping(address => uint256) public addressToNgoId;

    // Mapping from NGO ID to NGO data
    mapping(uint256 => NGO) public ngos;

    // Mapping from NGO ID to activity logs
    mapping(uint256 => string[]) public ngoActivityLogs;

    // Count of verified NGOs (incremented when NGO moves to Verified)
    uint256 public verifiedCount;

    // Admin verification frozen flag - when true, only governance-based verification is allowed
    bool public adminVerificationFrozen;

    // Governance contract instance
    NGOGovernance public governance;

    // Events
    event NGORegistered(uint256 indexed ngoId, address indexed ngoAddress, string name);
    event NGOVerified(uint256 indexed ngoId, address indexed verifier);
    event NGOStatusChanged(uint256 indexed ngoId, NGOStatus oldStatus, NGOStatus newStatus);
    event NGOReputationUpdated(uint256 indexed ngoId, uint256 oldScore, uint256 newScore);
    event NGOActivityLogged(uint256 indexed ngoId, string activity);
    event NGOGovernanceUpdated(address indexed oldGovernance, address indexed newGovernance);
    event AdminVerificationFrozen(address indexed triggeredBy, uint256 timestamp);

    constructor(address governanceAddress) {
        require(governanceAddress != address(0), "Invalid governance address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        governance = NGOGovernance(governanceAddress);
        
        emit NGOGovernanceUpdated(address(0), governanceAddress);
    }

    /**
     * @notice Register a new NGO
     */
    function registerNGO(
        address ngoAddress,
        string memory name,
        string memory registrationNumber,
        string memory country,
        string memory category,
        string memory kycDocumentHash
    ) external whenNotPaused returns (uint256) {
        require(ngoAddress != address(0), "Invalid NGO address");
        require(addressToNgoId[ngoAddress] == 0, "NGO already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(registrationNumber).length > 0, "Registration number required");

        uint256 ngoId = ++_ngoIdCounter;

        ngos[ngoId] = NGO({
            ngoId: ngoId,
            ngoAddress: ngoAddress,
            name: name,
            registrationNumber: registrationNumber,
            country: country,
            category: category,
            kycDocumentHash: kycDocumentHash,
            registeredAt: block.timestamp,
            verifiedAt: 0,
            status: NGOStatus.Pending,
            reputationScore: 500,
            totalCampaigns: 0,
            totalFundsRaised: 0,
            totalBeneficiaries: 0,
            isActive: true
        });

        addressToNgoId[ngoAddress] = ngoId;

        emit NGORegistered(ngoId, ngoAddress, name);
        logActivity(ngoId, "NGO registered");

        return ngoId;
    }

    /**
     * @notice Verify an NGO (called by verifier after KYC check)
     */
    function verifyNGO(uint256 ngoId) external onlyRole(VERIFIER_ROLE) {
        NGO storage ngo = ngos[ngoId];
        require(ngo.ngoId != 0, "NGO does not exist");
        require(ngo.status == NGOStatus.Pending, "NGO is not pending verification");

        require(!adminVerificationFrozen, "Admin verification is frozen");

        NGOStatus oldStatus = ngo.status;
        ngo.status = NGOStatus.Verified;
        ngo.verifiedAt = block.timestamp;

    verifiedCount += 1;

        emit NGOVerified(ngoId, msg.sender);
        emit NGOStatusChanged(ngoId, oldStatus, NGOStatus.Verified);
        logActivity(ngoId, "NGO verified by verifier");
    }

    /**
     * @notice Verify NGO through governance proposal
     */
    function verifyNGOThroughGovernance(uint256 ngoId) external {
        NGO storage ngo = ngos[ngoId];
        require(ngo.ngoId != 0, "NGO does not exist");
        require(ngo.status == NGOStatus.Pending, "NGO is not pending verification");

        // Check if caller has sufficient reputation or is verifier
        (uint256 reputationScore, , , , ) = governance.userReputations(msg.sender);
        // If admin verification is frozen, require reputation-based verification (governance-only)
        if (adminVerificationFrozen) {
            require(reputationScore >= 100, "Governance-only: insufficient reputation");
        } else {
            require(
                hasRole(VERIFIER_ROLE, msg.sender) || reputationScore >= 100,
                "Not authorized"
            );
        }

        NGOStatus oldStatus = ngo.status;
        ngo.status = NGOStatus.Verified;
        ngo.verifiedAt = block.timestamp;

    verifiedCount += 1;

        emit NGOVerified(ngoId, msg.sender);
        emit NGOStatusChanged(ngoId, oldStatus, NGOStatus.Verified);
        logActivity(ngoId, "NGO verified through governance");
    }

    /**
     * @notice Reject an NGO application
     */
    function rejectNGO(uint256 ngoId, string memory reason) external onlyRole(VERIFIER_ROLE) {
        NGO storage ngo = ngos[ngoId];
        require(ngo.ngoId != 0, "NGO does not exist");
        require(ngo.status == NGOStatus.Pending, "NGO is not pending verification");

        NGOStatus oldStatus = ngo.status;
        ngo.status = NGOStatus.Rejected;

        emit NGOStatusChanged(ngoId, oldStatus, NGOStatus.Rejected);
        logActivity(ngoId, string(abi.encodePacked("NGO rejected: ", reason)));
    }

    /**
     * @notice Suspend an NGO
     */
    function suspendNGO(uint256 ngoId, string memory reason) external onlyRole(ADMIN_ROLE) {
        NGO storage ngo = ngos[ngoId];
        require(ngo.ngoId != 0, "NGO does not exist");
        require(ngo.status == NGOStatus.Verified, "Only verified NGOs can be suspended");

        NGOStatus oldStatus = ngo.status;
        ngo.status = NGOStatus.Suspended;
        ngo.isActive = false;

        emit NGOStatusChanged(ngoId, oldStatus, NGOStatus.Suspended);
        logActivity(ngoId, string(abi.encodePacked("NGO suspended: ", reason)));
    }

    /**
     * @notice Suspend NGO through governance challenge
     */
    function suspendNGOThroughGovernance(uint256 ngoId, string memory reason) external {
        NGO storage ngo = ngos[ngoId];
        require(ngo.ngoId != 0, "NGO does not exist");
        require(ngo.status == NGOStatus.Verified, "Only verified NGOs can be suspended");

        // Check if caller has sufficient reputation
        (, uint256 reputationScore, , , ) = governance.userReputations(msg.sender);
        require(reputationScore >= 200, "Insufficient reputation");

        NGOStatus oldStatus = ngo.status;
        ngo.status = NGOStatus.Suspended;
        ngo.isActive = false;

        emit NGOStatusChanged(ngoId, oldStatus, NGOStatus.Suspended);
        logActivity(ngoId, string(abi.encodePacked("NGO suspended through governance: ", reason)));
    }

    /**
     * @notice Blacklist an NGO
     */
    function blacklistNGO(uint256 ngoId, string memory reason) external onlyRole(ADMIN_ROLE) {
        NGO storage ngo = ngos[ngoId];
        require(ngo.ngoId != 0, "NGO does not exist");

        NGOStatus oldStatus = ngo.status;
        ngo.status = NGOStatus.Blacklisted;
        ngo.isActive = false;

        emit NGOStatusChanged(ngoId, oldStatus, NGOStatus.Blacklisted);
        logActivity(ngoId, string(abi.encodePacked("NGO blacklisted: ", reason)));
    }

    /**
     * @notice Update NGO reputation score
     */
    function updateReputation(uint256 ngoId, uint256 newScore) external onlyRole(ADMIN_ROLE) {
        require(newScore <= 1000, "Score must be between 0 and 1000");
        NGO storage ngo = ngos[ngoId];
        require(ngo.ngoId != 0, "NGO does not exist");

        uint256 oldScore = ngo.reputationScore;
        ngo.reputationScore = newScore;

        emit NGOReputationUpdated(ngoId, oldScore, newScore);
    }

    /**
     * @notice Update NGO statistics
     */
    function updateStatistics(
        uint256 ngoId,
        uint256 campaignCount,
        uint256 fundsRaised,
        uint256 beneficiaries
    ) external onlyRole(ADMIN_ROLE) {
        NGO storage ngo = ngos[ngoId];
        require(ngo.ngoId != 0, "NGO does not exist");

        ngo.totalCampaigns = campaignCount;
        ngo.totalFundsRaised = fundsRaised;
        ngo.totalBeneficiaries = beneficiaries;
    }

    /**
     * @notice Log NGO activity
     */
    function logActivity(uint256 ngoId, string memory activity) public {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || 
            hasRole(VERIFIER_ROLE, msg.sender) ||
            ngos[ngoId].ngoAddress == msg.sender,
            "Not authorized"
        );
        require(ngos[ngoId].ngoId != 0, "NGO does not exist");
        ngoActivityLogs[ngoId].push(activity);
        emit NGOActivityLogged(ngoId, activity);
    }

    /**
     * @notice Update governance contract address
     */
    function updateGovernance(address newGovernanceAddress) external onlyRole(ADMIN_ROLE) {
        require(newGovernanceAddress != address(0), "Invalid governance address");
        address oldGovernance = address(governance);
        governance = NGOGovernance(newGovernanceAddress);
        emit NGOGovernanceUpdated(oldGovernance, newGovernanceAddress);
    }

    /**
     * @notice Check if NGO is verified and active
     */
    function isNGOVerified(address ngoAddress) external view returns (bool) {
        uint256 ngoId = addressToNgoId[ngoAddress];
        if (ngoId == 0) return false;
        NGO memory ngo = ngos[ngoId];
        return ngo.status == NGOStatus.Verified && ngo.isActive;
    }

    /**
     * @notice Get NGO details by address
     */
    function getNGOByAddress(address ngoAddress) external view returns (NGO memory) {
        uint256 ngoId = addressToNgoId[ngoAddress];
        require(ngoId != 0, "NGO not found");
        return ngos[ngoId];
    }

    /**
     * @notice Get NGO details by ID
     */
    function getNGOById(uint256 ngoId) external view returns (NGO memory) {
        require(ngos[ngoId].ngoId != 0, "NGO does not exist");
        return ngos[ngoId];
    }

    /**
     * @notice Get NGO activity logs
     */
    function getActivityLogs(uint256 ngoId) external view returns (string[] memory) {
        require(ngos[ngoId].ngoId != 0, "NGO does not exist");
        return ngoActivityLogs[ngoId];
    }

    /**
     * @notice Get total NGO count
     */
    function getTotalNGOs() external view returns (uint256) {
        return _ngoIdCounter;
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Freeze admin verification
     * @dev When frozen, verifyNGO (admin/verifier) will be disabled and only governance-based verification will work
     */
    function freezeAdminVerification() external onlyRole(ADMIN_ROLE) {
        require(!adminVerificationFrozen, "Admin verification already frozen");
        adminVerificationFrozen = true;
        emit AdminVerificationFrozen(msg.sender, block.timestamp);
    }
}