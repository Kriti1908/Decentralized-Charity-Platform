// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SoulboundToken
 * @notice Non-transferable tokens representing beneficiary entitlements
 * @dev ERC721 with transfer restrictions - implements Soulbound Token concept
 * 
 * Key Features:
 * - Non-transferable (soulbound to beneficiary)
 * - Represents specific entitlement (funds for specific service)
 * - Redeemable by authorized service providers
 * - Time-limited validity
 * - Full audit trail
 */
contract SoulboundToken is ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct TokenMetadata {
        uint256 tokenId;
        address beneficiary;
        uint256 campaignId;
        uint256 entitledAmount;
        string serviceType; // e.g., "Eye Surgery", "School Fees", "Medical Treatment"
        uint256 issuedAt;
        uint256 expiryDate;
        bool isRedeemed;
        address redeemedBy;
        uint256 redeemedAt;
        string proofOfServiceHash; // IPFS hash of service delivery proof
        TokenStatus status;
    }

    enum TokenStatus {
        Active,
        Redeemed,
        Expired,
        Revoked
    }

    // Token ID counter
    uint256 private _tokenIdCounter;

    // Mapping from token ID to metadata
    mapping(uint256 => TokenMetadata) public tokenMetadata;

    // Mapping from beneficiary to their token IDs
    mapping(address => uint256[]) public beneficiaryTokens;

    // Mapping from campaign ID to token IDs
    mapping(uint256 => uint256[]) public campaignTokens;

    // Events
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed beneficiary,
        uint256 indexed campaignId,
        uint256 entitledAmount,
        string serviceType,
        uint256 expiryDate
    );

    event TokenRedeemed(
        uint256 indexed tokenId,
        address indexed redeemer,
        address indexed beneficiary,
        string proofOfServiceHash,
        uint256 redeemedAt
    );

    event TokenRevoked(uint256 indexed tokenId, string reason);

    event TokenExpired(uint256 indexed tokenId);

    constructor() ERC721("CharityEntitlementToken", "CET") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @notice Mint a new soulbound token to a beneficiary
     * @param beneficiary Address of the beneficiary
     * @param campaignId ID of the campaign this token belongs to
     * @param entitledAmount Amount the beneficiary is entitled to
     * @param serviceType Type of service (e.g., "Eye Surgery")
     * @param validityPeriod How long the token is valid (in seconds)
     */
    function mintToken(
        address beneficiary,
        uint256 campaignId,
        uint256 entitledAmount,
        string memory serviceType,
        uint256 validityPeriod
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(entitledAmount > 0, "Entitled amount must be greater than 0");
        require(validityPeriod > 0, "Validity period must be greater than 0");

        uint256 tokenId = _tokenIdCounter++;
        uint256 expiryDate = block.timestamp + validityPeriod;

        _safeMint(beneficiary, tokenId);

        tokenMetadata[tokenId] = TokenMetadata({
            tokenId: tokenId,
            beneficiary: beneficiary,
            campaignId: campaignId,
            entitledAmount: entitledAmount,
            serviceType: serviceType,
            issuedAt: block.timestamp,
            expiryDate: expiryDate,
            isRedeemed: false,
            redeemedBy: address(0),
            redeemedAt: 0,
            proofOfServiceHash: "",
            status: TokenStatus.Active
        });

        beneficiaryTokens[beneficiary].push(tokenId);
        campaignTokens[campaignId].push(tokenId);

        emit TokenMinted(tokenId, beneficiary, campaignId, entitledAmount, serviceType, expiryDate);

        return tokenId;
    }

    /**
     * @notice Redeem a token (called by service provider after delivering service)
     * @param tokenId ID of the token to redeem
     * @param proofOfServiceHash IPFS hash of proof of service delivery
     */
    function redeemToken(uint256 tokenId, string memory proofOfServiceHash)
        external
        onlyRole(REDEEMER_ROLE)
        nonReentrant
        whenNotPaused
    {
        TokenMetadata storage metadata = tokenMetadata[tokenId];

        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(metadata.status == TokenStatus.Active, "Token is not active");
        require(!metadata.isRedeemed, "Token already redeemed");
        require(block.timestamp <= metadata.expiryDate, "Token has expired");
        require(bytes(proofOfServiceHash).length > 0, "Proof of service required");

        metadata.isRedeemed = true;
        metadata.redeemedBy = msg.sender;
        metadata.redeemedAt = block.timestamp;
        metadata.proofOfServiceHash = proofOfServiceHash;
        metadata.status = TokenStatus.Redeemed;

        emit TokenRedeemed(tokenId, msg.sender, metadata.beneficiary, proofOfServiceHash, block.timestamp);
    }

    /**
     * @notice Revoke a token (admin function for emergency situations)
     * @param tokenId ID of the token to revoke
     * @param reason Reason for revocation
     */
    function revokeToken(uint256 tokenId, string memory reason)
        external
        onlyRole(ADMIN_ROLE)
    {
        TokenMetadata storage metadata = tokenMetadata[tokenId];
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(metadata.status == TokenStatus.Active, "Token is not active");

        metadata.status = TokenStatus.Revoked;

        emit TokenRevoked(tokenId, reason);
    }

    /**
     * @notice Mark expired tokens (can be called by anyone)
     * @param tokenId ID of the token to check and mark as expired
     */
    function markExpired(uint256 tokenId) external {
        TokenMetadata storage metadata = tokenMetadata[tokenId];
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(metadata.status == TokenStatus.Active, "Token is not active");
        require(block.timestamp > metadata.expiryDate, "Token has not expired yet");

        metadata.status = TokenStatus.Expired;

        emit TokenExpired(tokenId);
    }

    /**
     * @notice Get token metadata
     * @param tokenId ID of the token
     */
    function getTokenMetadata(uint256 tokenId) external view returns (TokenMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenMetadata[tokenId];
    }

    /**
     * @notice Get all tokens owned by a beneficiary
     * @param beneficiary Address of the beneficiary
     */
    function getBeneficiaryTokens(address beneficiary) external view returns (uint256[] memory) {
        return beneficiaryTokens[beneficiary];
    }

    /**
     * @notice Get all tokens for a campaign
     * @param campaignId ID of the campaign
     */
    function getCampaignTokens(uint256 campaignId) external view returns (uint256[] memory) {
        return campaignTokens[campaignId];
    }

    /**
     * @notice Check if a token is valid for redemption
     * @param tokenId ID of the token
     */
    function isTokenRedeemable(uint256 tokenId) external view returns (bool) {
        TokenMetadata memory metadata = tokenMetadata[tokenId];
        return (
            _ownerOf(tokenId) != address(0) &&
            metadata.status == TokenStatus.Active &&
            !metadata.isRedeemed &&
            block.timestamp <= metadata.expiryDate
        );
    }

    // Override transfer functions to make tokens non-transferable (soulbound)
    function transferFrom(address, address, uint256) public pure override(ERC721, IERC721) {
        revert("Soulbound tokens cannot be transferred");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override(ERC721, IERC721) {
        revert("Soulbound tokens cannot be transferred");
    }

    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert("Soulbound tokens cannot be approved");
    }

    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert("Soulbound tokens cannot be approved");
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
