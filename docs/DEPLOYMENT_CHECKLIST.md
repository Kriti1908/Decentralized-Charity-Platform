# Deployment Checklist

## Pre-Deployment

### 1. Environment Setup
- [ ] All `.env.example` files copied to `.env` with proper values
- [ ] MongoDB connection string configured
- [ ] Infura/Alchemy API keys obtained
- [ ] WalletConnect Project ID obtained
- [ ] Pinata API keys obtained
- [ ] Etherscan API key obtained

### 2. Smart Contract Preparation
- [ ] Contracts compiled without errors: `npx hardhat compile`
- [ ] All tests passing: `npx hardhat test`
- [ ] Test coverage reviewed: `npx hardhat coverage`
- [ ] Gas usage optimized
- [ ] Security audit completed (for mainnet)

### 3. Code Quality
- [ ] Linting passed: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] No console.logs in production code
- [ ] Error handling implemented
- [ ] Comments and documentation updated

## Smart Contract Deployment

### Testnet (Sepolia)

1. **Fund Deployer Wallet**
   ```bash
   # Get Sepolia ETH from faucet
   # Verify balance
   ```

2. **Deploy Contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. **Save Contract Addresses**
   - [ ] NGORegistry: `_________________`
   - [ ] ServiceProviderRegistry: `_________________`
   - [ ] SoulboundToken: `_________________`
   - [ ] CampaignFactory: `_________________`

4. **Verify Contracts on Etherscan**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

5. **Test Deployed Contracts**
   - [ ] Register test NGO
   - [ ] Verify NGO
   - [ ] Create test campaign
   - [ ] Make test donation
   - [ ] Issue test token
   - [ ] Redeem test token

### Mainnet (Production)

⚠️ **CRITICAL: Only after thorough testing and security audit**

1. **Final Checks**
   - [ ] Security audit report reviewed
   - [ ] All testnet tests successful
   - [ ] Emergency procedures documented
   - [ ] Multi-sig wallet prepared for admin functions
   - [ ] Gas price reviewed and acceptable

2. **Deploy to Mainnet**
   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```

3. **Verify Mainnet Contracts**
   ```bash
   npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
   ```

4. **Configure Mainnet Addresses**
   - Update all `.env` files with mainnet addresses
   - Update frontend configuration
   - Update backend configuration

## Backend Deployment

### Option 1: Railway

1. **Create Railway Project**
   - [ ] Connect GitHub repository
   - [ ] Configure environment variables
   - [ ] Set start command: `npm start`

2. **Deploy**
   ```bash
   railway up
   ```

3. **Verify**
   - [ ] Health check endpoint working
   - [ ] Database connection successful
   - [ ] API endpoints responding

### Option 2: AWS Elastic Beanstalk

1. **Initialize EB**
   ```bash
   cd backend
   eb init
   ```

2. **Create Environment**
   ```bash
   eb create production
   ```

3. **Deploy**
   ```bash
   eb deploy
   ```

### MongoDB Setup

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured
- [ ] Connection string tested
- [ ] Backup policy configured

## Frontend Deployment

### Vercel Deployment

1. **Connect Repository**
   - [ ] Import project to Vercel
   - [ ] Select `frontend` directory as root

2. **Configure Environment Variables**
   - [ ] All `NEXT_PUBLIC_*` variables added
   - [ ] Build settings configured

3. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Configure Custom Domain** (optional)
   - [ ] Domain added to Vercel
   - [ ] DNS configured
   - [ ] SSL certificate active

## Post-Deployment

### 1. Functionality Testing
- [ ] Wallet connection works
- [ ] NGO registration works
- [ ] Campaign creation works
- [ ] Donation flow works
- [ ] Token issuance works
- [ ] Token redemption works
- [ ] All pages load correctly
- [ ] Mobile responsive
- [ ] Cross-browser compatibility

### 2. Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Gas costs reasonable

### 3. Security Testing
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] SQL injection protected
- [ ] XSS protection enabled
- [ ] Authentication working
- [ ] Authorization checks in place

### 4. Monitoring Setup
- [ ] Application logging configured
- [ ] Error tracking enabled (Sentry)
- [ ] Uptime monitoring configured
- [ ] Analytics enabled
- [ ] Smart contract event monitoring

### 5. Documentation
- [ ] README updated with live URLs
- [ ] API documentation published
- [ ] User guide created
- [ ] Developer documentation updated
- [ ] Known issues documented

### 6. Communication
- [ ] Announce deployment
- [ ] Share live URLs
- [ ] Provide support channels
- [ ] Create feedback mechanism

## Emergency Procedures

### Smart Contract Issues
- [ ] Admin private keys secured
- [ ] Pause mechanism tested
- [ ] Emergency contact list prepared
- [ ] Incident response plan documented

### Backend Issues
- [ ] Rollback procedure documented
- [ ] Backup restoration tested
- [ ] Load balancer configured
- [ ] DDoS protection enabled

### Database Issues
- [ ] Backup schedule configured
- [ ] Point-in-time recovery tested
- [ ] Replica set configured
- [ ] Monitoring alerts set

## Rollback Plan

If critical issues discovered:

1. **Frontend**
   ```bash
   vercel rollback <DEPLOYMENT_URL>
   ```

2. **Backend**
   - Revert to previous deployment
   - Restore database from backup if needed

3. **Smart Contracts**
   - Use pause mechanism
   - Deploy fix
   - Upgrade if using proxy pattern

## Maintenance Schedule

- [ ] Weekly: Review error logs
- [ ] Weekly: Check system health
- [ ] Monthly: Update dependencies
- [ ] Monthly: Security review
- [ ] Quarterly: Performance audit
- [ ] Yearly: Comprehensive security audit

## Success Criteria

- [ ] All systems operational
- [ ] No critical errors in logs
- [ ] Performance metrics acceptable
- [ ] User feedback positive
- [ ] First transaction successful

## Sign-Off

- [ ] Developer approval
- [ ] QA approval
- [ ] Product owner approval
- [ ] Security team approval (for mainnet)

---

**Deployment Date:** __________________

**Deployed By:** __________________

**Notes:**
