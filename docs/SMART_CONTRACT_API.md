# Smart Contract API Documentation

## SoulboundToken Contract

### Overview
Non-transferable ERC-721 tokens representing beneficiary entitlements. These tokens cannot be traded or transferred, ensuring funds reach intended purposes.

### Key Functions

#### mintToken
```solidity
function mintToken(
    address beneficiary,
    uint256 campaignId,
    uint256 entitledAmount,
    string memory serviceType,
    uint256 validityPeriod
) external returns (uint256)
```

**Description:** Mints a new soulbound token to a beneficiary.

**Parameters:**
- `beneficiary`: Address of the beneficiary receiving the token
- `campaignId`: ID of the campaign this token belongs to
- `entitledAmount`: Amount (in wei) the beneficiary is entitled to
- `serviceType`: Type of service (e.g., "Eye Surgery", "School Fees")
- `validityPeriod`: How long the token is valid (in seconds)

**Returns:** Token ID

**Access:** MINTER_ROLE

**Events Emitted:** `TokenMinted`

**Example:**
```javascript
const tx = await soulboundToken.mintToken(
  beneficiaryAddress,
  1, // campaignId
  ethers.parseEther("1.0"),
  "Eye Surgery",
  30 * 24 * 60 * 60 // 30 days
);
```

#### redeemToken
```solidity
function redeemToken(
    uint256 tokenId,
    string memory proofOfServiceHash
) external
```

**Description:** Redeems a token after service delivery.

**Parameters:**
- `tokenId`: ID of the token to redeem
- `proofOfServiceHash`: IPFS hash of proof of service delivery

**Access:** REDEEMER_ROLE

**Events Emitted:** `TokenRedeemed`

**Requirements:**
- Token must exist
- Token must be active (not already redeemed)
- Token must not be expired
- Proof of service required

**Example:**
```javascript
const tx = await soulboundToken.redeemToken(
  tokenId,
  "QmProofHash123..."
);
```

#### getTokenMetadata
```solidity
function getTokenMetadata(uint256 tokenId) 
    external view returns (TokenMetadata memory)
```

**Description:** Retrieves complete metadata for a token.

**Returns:** TokenMetadata struct containing:
- `tokenId`: Token identifier
- `beneficiary`: Beneficiary address
- `campaignId`: Associated campaign
- `entitledAmount`: Amount entitled
- `serviceType`: Service description
- `issuedAt`: Issue timestamp
- `expiryDate`: Expiry timestamp
- `isRedeemed`: Redemption status
- `redeemedBy`: Redeemer address
- `redeemedAt`: Redemption timestamp
- `proofOfServiceHash`: IPFS proof hash
- `status`: Current status

#### isTokenRedeemable
```solidity
function isTokenRedeemable(uint256 tokenId) 
    external view returns (bool)
```

**Description:** Checks if a token is valid for redemption.

**Returns:** True if token is active, not redeemed, and not expired

---

## NGORegistry Contract

### Overview
Manages NGO registration, verification, and reputation.

### Key Functions

#### registerNGO
```solidity
function registerNGO(
    address ngoAddress,
    string memory name,
    string memory registrationNumber,
    string memory country,
    string memory category,
    string memory kycDocumentHash
) external returns (uint256)
```

**Description:** Registers a new NGO.

**Parameters:**
- `ngoAddress`: Ethereum address of the NGO
- `name`: NGO name
- `registrationNumber`: Official registration number
- `country`: Country of operation
- `category`: Category (e.g., "Health", "Education")
- `kycDocumentHash`: IPFS hash of KYC documents

**Returns:** NGO ID

**Events Emitted:** `NGORegistered`

**Example:**
```javascript
const tx = await ngoRegistry.registerNGO(
  ngoAddress,
  "Red Cross",
  "REG123456",
  "USA",
  "Health",
  "QmKYCDocHash..."
);
```

#### verifyNGO
```solidity
function verifyNGO(uint256 ngoId) external
```

**Description:** Verifies an NGO after KYC check.

**Access:** VERIFIER_ROLE

**Events Emitted:** `NGOVerified`, `NGOStatusChanged`

#### isNGOVerified
```solidity
function isNGOVerified(address ngoAddress) 
    external view returns (bool)
```

**Description:** Checks if an NGO is verified and active.

**Returns:** True if NGO is verified and active

---

## CampaignFactory Contract

### Overview
Factory contract for creating and managing charity campaigns.

### Key Functions

#### createCampaign
```solidity
function createCampaign(
    string memory title,
    string memory description,
    string memory category,
    uint256 targetAmount,
    uint256 duration,
    string memory documentsHash
) external returns (uint256)
```

**Description:** Creates a new campaign.

**Parameters:**
- `title`: Campaign title
- `description`: Campaign description
- `category`: Campaign category
- `targetAmount`: Fundraising target (in wei)
- `duration`: Campaign duration (in seconds)
- `documentsHash`: IPFS hash of campaign documents

**Returns:** Campaign ID

**Access:** Verified NGOs only

**Events Emitted:** `CampaignCreated`

**Example:**
```javascript
const tx = await campaignFactory.createCampaign(
  "Save 100 Children",
  "Provide medical care to 100 children",
  "Health",
  ethers.parseEther("100"),
  30 * 24 * 60 * 60, // 30 days
  "QmCampaignDocs..."
);
```

#### donate
```solidity
function donate(uint256 campaignId) external payable
```

**Description:** Donate to a campaign.

**Parameters:**
- `campaignId`: ID of the campaign

**Value:** Send ETH with the transaction

**Events Emitted:** `DonationReceived`

**Requirements:**
- Campaign must be active
- Campaign must not be ended
- Donation amount must be > 0

**Example:**
```javascript
const tx = await campaignFactory.donate(campaignId, {
  value: ethers.parseEther("1.0")
});
```

#### issueBeneficiaryToken
```solidity
function issueBeneficiaryToken(
    uint256 campaignId,
    address beneficiary,
    uint256 entitledAmount,
    string memory serviceType,
    uint256 validityPeriod
) external returns (uint256)
```

**Description:** Issues a soulbound token to a beneficiary.

**Parameters:**
- `campaignId`: Campaign ID
- `beneficiary`: Beneficiary address
- `entitledAmount`: Amount entitled (wei)
- `serviceType`: Service description
- `validityPeriod`: Token validity (seconds)

**Returns:** Token ID

**Access:** Campaign creator only

**Events Emitted:** `BeneficiaryTokenIssued`

**Example:**
```javascript
const tx = await campaignFactory.issueBeneficiaryToken(
  campaignId,
  beneficiaryAddress,
  ethers.parseEther("0.5"),
  "Eye Surgery",
  30 * 24 * 60 * 60
);
```

#### addMilestone
```solidity
function addMilestone(
    uint256 campaignId,
    string memory description,
    uint256 targetAmount,
    uint256 deadline
) external
```

**Description:** Adds a milestone to a campaign.

**Access:** Campaign creator only

**Events Emitted:** `MilestoneAdded`

#### completeMilestone
```solidity
function completeMilestone(
    uint256 campaignId,
    uint256 milestoneIndex,
    string memory proofHash
) external
```

**Description:** Marks a milestone as completed.

**Access:** Campaign creator only

**Events Emitted:** `MilestoneCompleted`

---

## ServiceProviderRegistry Contract

### Overview
Manages service providers who can redeem beneficiary tokens.

### Key Functions

#### registerProvider
```solidity
function registerProvider(
    address providerAddress,
    string memory name,
    string memory registrationNumber,
    string memory serviceType,
    string memory location,
    string memory verificationDocHash
) external returns (uint256)
```

**Description:** Registers a new service provider.

**Returns:** Provider ID

**Events Emitted:** `ProviderRegistered`

#### verifyProvider
```solidity
function verifyProvider(uint256 providerId) external
```

**Description:** Verifies a service provider.

**Access:** VERIFIER_ROLE

**Events Emitted:** `ProviderVerified`

---

## Common Patterns

### Checking Roles
```javascript
const MINTER_ROLE = await contract.MINTER_ROLE();
const hasRole = await contract.hasRole(MINTER_ROLE, address);
```

### Granting Roles
```javascript
const MINTER_ROLE = await contract.MINTER_ROLE();
await contract.grantRole(MINTER_ROLE, address);
```

### Emergency Pause
```javascript
// Pause contract
await contract.pause();

// Unpause contract
await contract.unpause();
```

### Event Filtering
```javascript
// Listen for new donations
campaignFactory.on("DonationReceived", (campaignId, donor, amount) => {
  console.log(`New donation: ${amount} from ${donor} to campaign ${campaignId}`);
});

// Query past events
const filter = campaignFactory.filters.DonationReceived(campaignId);
const events = await campaignFactory.queryFilter(filter);
```

---

## Gas Optimization Tips

1. **Batch Operations:** Issue multiple tokens in one transaction when possible
2. **Use Events:** Emit events for off-chain indexing instead of storing everything on-chain
3. **Optimize Storage:** Use appropriate data types (uint256 vs uint128)
4. **Minimize String Storage:** Store strings on IPFS, only store hashes on-chain

## Security Best Practices

1. **Always Check Return Values:** Verify transaction success
2. **Use SafeMath:** Built into Solidity 0.8+
3. **Reentrancy Protection:** All financial functions use `nonReentrant`
4. **Access Control:** Functions restricted by role or ownership
5. **Pausability:** Emergency pause mechanism available

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Only verified NGOs can create campaigns" | NGO not verified | Complete KYC verification |
| "Token already redeemed" | Attempting to redeem twice | Check token status first |
| "Token has expired" | Token validity period passed | Check expiry date |
| "Insufficient campaign funds" | Not enough funds to issue token | Ensure sufficient donations |
| "Soulbound tokens cannot be transferred" | Attempting to transfer | Tokens are non-transferable by design |
