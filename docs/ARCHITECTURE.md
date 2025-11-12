# Architecture Overview

## System Architecture

The platform consists of three main layers:

### 1. Blockchain Layer (Ethereum/Sepolia)
- **Smart Contracts**: Core business logic
- **Immutable Storage**: Critical transaction data
- **Trustless Execution**: No intermediary required

### 2. Application Layer
- **Frontend (Next.js)**: User interface
- **Backend (Node.js/Express)**: API and business logic
- **Database (MongoDB)**: Off-chain metadata storage

### 3. Storage Layer
- **IPFS**: Decentralized document storage
- **MongoDB**: User profiles, search indices

## Component Interaction Flow

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│  MetaMask   │  │   Backend   │
│  (Web3)     │  │   (API)     │
└──────┬──────┘  └──────┬──────┘
       │                │
       │                ▼
       │         ┌─────────────┐
       │         │  MongoDB    │
       │         └─────────────┘
       │
       ▼
┌─────────────┐
│  Ethereum   │
│  Blockchain │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    IPFS     │
└─────────────┘
```

## Smart Contract Architecture

### Contract Hierarchy

```
CharityPlatform (Platform Governance)
├── NGORegistry (NGO Management)
├── ServiceProviderRegistry (Provider Management)
├── SoulboundToken (Beneficiary Tokens)
└── CampaignFactory (Campaign Management)
    └── Uses: NGORegistry, SoulboundToken
```

### Key Design Patterns

1. **Access Control Pattern**
   - Role-based permissions (OpenZeppelin AccessControl)
   - Separation of concerns (Admin, Verifier, Minter roles)

2. **Factory Pattern**
   - CampaignFactory creates campaign instances
   - Centralized campaign management

3. **Registry Pattern**
   - NGORegistry for NGO management
   - ServiceProviderRegistry for provider management

4. **Token Standards**
   - ERC-721 modified for Soulbound tokens
   - Non-transferable by design

## Data Flow

### Campaign Creation Flow

```
1. NGO → Registers on platform
2. Admin → Verifies NGO (KYC)
3. NGO → Creates campaign (on-chain + off-chain)
4. Campaign → Published and discoverable
```

### Donation Flow

```
1. Donor → Browses campaigns
2. Donor → Sends ETH to campaign contract
3. Smart Contract → Records donation
4. Backend → Logs transaction details
5. Donor → Receives confirmation
```

### Beneficiary Token Issuance Flow

```
1. NGO → Identifies beneficiary
2. NGO → Submits beneficiary details
3. Platform → Verifies beneficiary
4. Smart Contract → Mints Soulbound Token
5. Token → Sent to beneficiary wallet
```

### Token Redemption Flow

```
1. Beneficiary → Visits service provider
2. Provider → Verifies identity
3. Provider → Delivers service
4. Provider → Uploads proof to IPFS
5. Provider → Calls redeemToken()
6. Smart Contract → Validates and releases funds
7. All parties → Can verify on blockchain
```

## Security Architecture

### Multi-Layer Security

1. **Smart Contract Level**
   - ReentrancyGuard on fund transfers
   - Access control on sensitive functions
   - Pausable mechanism for emergencies
   - Input validation

2. **Application Level**
   - JWT authentication
   - Web3 signature verification
   - Rate limiting
   - CORS protection
   - Helmet security headers

3. **Data Level**
   - Private data stored off-chain
   - Public data on blockchain
   - Encrypted sensitive information
   - IPFS for document storage

## Scalability Considerations

### Current Architecture
- **Throughput**: Limited by Ethereum block time (~12-15 seconds)
- **Cost**: Gas fees per transaction
- **Storage**: Minimal on-chain storage, metadata off-chain

### Future Enhancements

1. **Layer 2 Solutions**
   - Deploy on Polygon for lower fees
   - Use Optimistic Rollups for scalability

2. **Caching Layer**
   - Redis for frequently accessed data
   - GraphQL for efficient queries

3. **Database Optimization**
   - Indexing strategy
   - Read replicas for scaling
   - Sharding for large datasets

## Technology Decisions

### Why Ethereum?
- **Mature Ecosystem**: Extensive tooling and libraries
- **Security**: Battle-tested and secure
- **Developer Community**: Large support community
- **Smart Contract Support**: Full Turing-complete language

### Why Next.js?
- **SSR/SSG**: Better SEO and performance
- **React**: Component-based architecture
- **API Routes**: Built-in backend capabilities
- **Developer Experience**: Hot reload, TypeScript support

### Why MongoDB?
- **Flexibility**: Schema-less for diverse data
- **Performance**: Fast reads for dashboards
- **Scalability**: Horizontal scaling support
- **JSON**: Native JSON support for blockchain data

### Why IPFS?
- **Decentralization**: No single point of failure
- **Content Addressing**: Immutable content
- **Cost-Effective**: Cheaper than on-chain storage
- **Censorship Resistant**: Distributed storage

## Integration Points

### External Services

1. **Infura/Alchemy**
   - Ethereum node provider
   - Reliable RPC endpoint

2. **The Graph**
   - Blockchain data indexing
   - Efficient querying

3. **Pinata/NFT.Storage**
   - IPFS pinning service
   - Reliable file availability

4. **Civic/Polygon ID**
   - Identity verification
   - KYC integration

5. **Etherscan**
   - Contract verification
   - Transaction explorer

## Monitoring & Logging

### Application Monitoring
- Winston for structured logging
- Error tracking with Sentry
- Performance monitoring

### Blockchain Monitoring
- Event listening for real-time updates
- Transaction status tracking
- Gas price optimization

## Deployment Architecture

### Development
```
Local Machine
├── Hardhat Node (Blockchain)
├── MongoDB (Database)
├── Next.js Dev Server (Frontend)
└── Express Dev Server (Backend)
```

### Production
```
Cloud Infrastructure
├── Sepolia/Mainnet (Blockchain)
├── MongoDB Atlas (Database)
├── Vercel (Frontend)
├── AWS/Railway (Backend)
└── IPFS (Storage)
```

## Future Architecture Enhancements

1. **Microservices**: Break backend into services
2. **Event-Driven**: Use message queues (RabbitMQ/Kafka)
3. **GraphQL**: Replace REST API
4. **Mobile App**: React Native application
5. **Analytics Dashboard**: Real-time analytics
6. **Multi-Chain**: Support multiple blockchains

## Performance Optimization

1. **Frontend**
   - Code splitting
   - Image optimization
   - Caching strategies

2. **Backend**
   - Database indexing
   - Query optimization
   - Connection pooling

3. **Blockchain**
   - Batch transactions
   - Gas optimization
   - Event-based updates

## Disaster Recovery

1. **Smart Contracts**
   - Pause mechanism
   - Upgrade pattern (proxy)
   - Emergency withdrawal

2. **Database**
   - Regular backups
   - Point-in-time recovery
   - Replica sets

3. **IPFS**
   - Multiple pinning services
   - Backup to alternative storage
