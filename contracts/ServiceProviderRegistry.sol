// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ServiceProviderRegistry
 * @notice Registry for service providers (hospitals, schools, etc.)
 * @dev Manages provider registration and token redemption authorization
 */
contract ServiceProviderRegistry is AccessControl, Pausable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum ProviderStatus {
        Pending,
        Verified,
        Rejected,
        Suspended
    }

    struct ServiceProvider {
        uint256 providerId;
        address providerAddress;
        string name;
        string registrationNumber;
        string serviceType; // e.g., "Healthcare", "Education"
        string location;
        string verificationDocHash; // IPFS hash
        uint256 registeredAt;
        uint256 verifiedAt;
        ProviderStatus status;
        uint256 totalRedemptions;
        uint256 totalAmountRedeemed;
        bool isActive;
    }

    // Provider ID counter
    uint256 private _providerIdCounter;

    // Mappings
    mapping(address => uint256) public addressToProviderId;
    mapping(uint256 => ServiceProvider) public providers;

    // Events
    event ProviderRegistered(uint256 indexed providerId, address indexed providerAddress, string name);
    event ProviderVerified(uint256 indexed providerId);
    event ProviderStatusChanged(uint256 indexed providerId, ProviderStatus oldStatus, ProviderStatus newStatus);
    event RedemptionRecorded(uint256 indexed providerId, uint256 amount);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @notice Register a new service provider
     */
    function registerProvider(
        address providerAddress,
        string memory name,
        string memory registrationNumber,
        string memory serviceType,
        string memory location,
        string memory verificationDocHash
    ) external whenNotPaused returns (uint256) {
        require(providerAddress != address(0), "Invalid address");
        require(addressToProviderId[providerAddress] == 0, "Provider already registered");

        uint256 providerId = ++_providerIdCounter;

        providers[providerId] = ServiceProvider({
            providerId: providerId,
            providerAddress: providerAddress,
            name: name,
            registrationNumber: registrationNumber,
            serviceType: serviceType,
            location: location,
            verificationDocHash: verificationDocHash,
            registeredAt: block.timestamp,
            verifiedAt: 0,
            status: ProviderStatus.Pending,
            totalRedemptions: 0,
            totalAmountRedeemed: 0,
            isActive: true
        });

        addressToProviderId[providerAddress] = providerId;

        emit ProviderRegistered(providerId, providerAddress, name);

        return providerId;
    }

    /**
     * @notice Verify a service provider
     */
    function verifyProvider(uint256 providerId) external onlyRole(VERIFIER_ROLE) {
        ServiceProvider storage provider = providers[providerId];
        require(provider.providerId != 0, "Provider does not exist");
        require(provider.status == ProviderStatus.Pending, "Provider is not pending");

        ProviderStatus oldStatus = provider.status;
        provider.status = ProviderStatus.Verified;
        provider.verifiedAt = block.timestamp;

        emit ProviderVerified(providerId);
        emit ProviderStatusChanged(providerId, oldStatus, ProviderStatus.Verified);
    }

    /**
     * @notice Record a token redemption
     */
    function recordRedemption(uint256 providerId, uint256 amount) external onlyRole(ADMIN_ROLE) {
        ServiceProvider storage provider = providers[providerId];
        require(provider.providerId != 0, "Provider does not exist");

        provider.totalRedemptions++;
        provider.totalAmountRedeemed += amount;

        emit RedemptionRecorded(providerId, amount);
    }

    /**
     * @notice Check if provider is verified
     */
    function isProviderVerified(address providerAddress) external view returns (bool) {
        uint256 providerId = addressToProviderId[providerAddress];
        if (providerId == 0) return false;
        ServiceProvider memory provider = providers[providerId];
        return provider.status == ProviderStatus.Verified && provider.isActive;
    }

    /**
     * @notice Get provider by address
     */
    function getProviderByAddress(address providerAddress) external view returns (ServiceProvider memory) {
        uint256 providerId = addressToProviderId[providerAddress];
        require(providerId != 0, "Provider not found");
        return providers[providerId];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
