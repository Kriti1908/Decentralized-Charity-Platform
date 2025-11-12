# Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher): [Download](https://nodejs.org/)
- **npm** or **yarn**: Comes with Node.js
- **Git**: [Download](https://git-scm.com/)
- **MongoDB**: [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **MetaMask** browser extension: [Install](https://metamask.io/)

## Step 1: Clone the Repository

```bash
git clone https://github.com/Kriti1908/Decentralized-Charity-Platform.git
cd Decentralized-Charity-Platform
```

## Step 2: Install Dependencies

### Install all dependencies at once:
```bash
npm run install:all
```

### Or install individually:

**Root (Smart Contracts):**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

## Step 3: Environment Configuration

### Root Directory (.env)
Copy `.env.example` to `.env` and fill in:

```bash
copy .env.example .env
```

Edit `.env` and add:
- `PRIVATE_KEY`: Your wallet private key (for deployment)
- `SEPOLIA_RPC_URL`: Get from [Infura](https://infura.io/) or [Alchemy](https://www.alchemy.com/)
- `ETHERSCAN_API_KEY`: Get from [Etherscan](https://etherscan.io/apis)

### Frontend (.env.local)
```bash
cd frontend
copy .env.example .env.local
```

Edit and configure RPC URL and WalletConnect Project ID.

### Backend (.env)
```bash
cd backend
copy .env.example .env
```

Edit and configure MongoDB URI and other settings.

## Step 4: Get Test Funds

1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Receive test ETH for deployment and testing

## Step 5: Compile Smart Contracts

```bash
npx hardhat compile
```

Expected output: `Compiled X Solidity files successfully`

## Step 6: Run Tests (Optional but Recommended)

```bash
npx hardhat test
```

All tests should pass ✅

## Step 7: Deploy Smart Contracts

### Local Network (for development):

**Terminal 1 - Start Hardhat Node:**
```bash
npx hardhat node
```

**Terminal 2 - Deploy:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia Testnet (for production-like testing):

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Important:** Save the deployed contract addresses from the output!

## Step 8: Update Contract Addresses

After deployment, update the addresses in:

1. **Frontend** `.env.local`:
```env
NEXT_PUBLIC_NGO_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_SOULBOUND_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_SERVICE_PROVIDER_REGISTRY_ADDRESS=0x...
```

2. **Backend** `.env`:
```env
CONTRACT_ADDRESS_NGO_REGISTRY=0x...
CONTRACT_ADDRESS_CAMPAIGN_FACTORY=0x...
CONTRACT_ADDRESS_SOULBOUND_TOKEN=0x...
CONTRACT_ADDRESS_SERVICE_PROVIDER_REGISTRY=0x...
```

## Step 9: Start MongoDB

If using local MongoDB:
```bash
mongod
```

Or ensure your MongoDB Atlas connection string is in backend `.env`.

## Step 10: Start the Backend

```bash
cd backend
npm run dev
```

Backend should start on `http://localhost:5000`

## Step 11: Start the Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

Frontend should start on `http://localhost:3000`

## Step 12: Connect MetaMask

1. Open `http://localhost:3000` in your browser
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve the connection
5. Switch to Sepolia network if prompted

## Verification

Visit the following to verify everything works:

- ✅ Frontend: http://localhost:3000
- ✅ Backend: http://localhost:5000/health
- ✅ MetaMask: Connected and on Sepolia network

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:** Ensure MongoDB is running or check your connection string.

### Issue: "Transaction failed - insufficient funds"
**Solution:** Get test ETH from Sepolia faucet.

### Issue: "Contract not deployed"
**Solution:** Deploy contracts first, then update addresses in .env files.

### Issue: "Module not found"
**Solution:** Run `npm install` in the respective directory.

## Next Steps

1. **Register an NGO:** Use the NGO registration form
2. **Create a Campaign:** After NGO verification
3. **Make a Donation:** Test the donation flow
4. **Issue Beneficiary Token:** Mint a soulbound token
5. **Redeem Token:** Test the redemption process

## Development Workflow

For active development, run all three services simultaneously:

```bash
# Terminal 1: Local blockchain
npx hardhat node

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

## Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Check test coverage
npx hardhat coverage

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Backend tests
cd backend && npm test

# Frontend build
cd frontend && npm run build
```

## Support

For issues or questions:
- Check the main [README.md](../README.md)
- Open an issue on GitHub
- Review the contract documentation

Happy building! 🚀
