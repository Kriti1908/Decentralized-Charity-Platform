#!/bin/bash

# filepath: /home/kriti-gupta/Kriti/Courses/SEM5/BWD/Project/Blockchain-Powered-Transparent-Charity-Platform/setup.sh
# Setup Script for Blockchain Charity Platform
# Run this script in a Linux terminal

echo "=================================="
echo "Blockchain Charity Platform Setup"
echo "=================================="
echo ""

# Check Node.js installation
echo -e "\e[33mChecking Node.js installation...\e[0m"
if ! command -v node &> /dev/null; then
    echo -e "\e[31m✗ Node.js not found. Please install Node.js from https://nodejs.org/\e[0m"
    exit 1
fi
nodeVersion=$(node --version)
echo -e "\e[32m✓ Node.js $nodeVersion installed\e[0m"

# Check npm installation
echo -e "\e[33mChecking npm installation...\e[0m"
if ! command -v npm &> /dev/null; then
    echo -e "\e[31m✗ npm not found\e[0m"
    exit 1
fi
npmVersion=$(npm --version)
echo -e "\e[32m✓ npm $npmVersion installed\e[0m"

# Check Git installation
echo -e "\e[33mChecking Git installation...\e[0m"
if ! command -v git &> /dev/null; then
    echo -e "\e[31m✗ Git not found. Please install Git from https://git-scm.com/\e[0m"
    exit 1
fi
gitVersion=$(git --version)
echo -e "\e[32m✓ $gitVersion installed\e[0m"

echo ""
echo -e "\e[33mInstalling dependencies...\e[0m"
echo ""

# Install root dependencies
echo -e "\e[36m1/3 Installing smart contract dependencies...\e[0m"
if ! npm install; then
    echo -e "\e[31m✗ Failed to install smart contract dependencies\e[0m"
    exit 1
fi
echo -e "\e[32m✓ Smart contract dependencies installed\e[0m"
echo ""

# Install frontend dependencies
echo -e "\e[36m2/3 Installing frontend dependencies...\e[0m"
cd frontend || exit
if ! npm install; then
    echo -e "\e[31m✗ Failed to install frontend dependencies\e[0m"
    cd ..
    exit 1
fi
echo -e "\e[32m✓ Frontend dependencies installed\e[0m"
cd ..
echo ""

# Install backend dependencies
echo -e "\e[36m3/3 Installing backend dependencies...\e[0m"
cd backend || exit
if ! npm install; then
    echo -e "\e[31m✗ Failed to install backend dependencies\e[0m"
    cd ..
    exit 1
fi
echo -e "\e[32m✓ Backend dependencies installed\e[0m"
cd ..
echo ""

# Setup environment files
echo -e "\e[33mSetting up environment files...\e[0m"

# Root .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "\e[32m✓ Created .env file (root)\e[0m"
    echo -e "\e[33m  ⚠ Please update .env with your configuration\e[0m"
else
    echo -e "\e[32m✓ .env file already exists (root)\e[0m"
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo -e "\e[32m✓ Created .env.local file (frontend)\e[0m"
    echo -e "\e[33m  ⚠ Please update frontend/.env.local with your configuration\e[0m"
else
    echo -e "\e[32m✓ .env.local file already exists (frontend)\e[0m"
fi

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "\e[32m✓ Created .env file (backend)\e[0m"
    echo -e "\e[33m  ⚠ Please update backend/.env with your configuration\e[0m"
else
    echo -e "\e[32m✓ .env file already exists (backend)\e[0m"
fi

echo ""
echo "=================================="
echo -e "\e[32mSetup Complete!\e[0m"
echo "=================================="
echo ""
echo -e "\e[33mNext Steps:\e[0m"
echo -e "\e[37m1. Update .env files with your configuration\e[0m"
echo -e "\e[37m2. Ensure MongoDB is running\e[0m"
echo -e "\e[37m3. Compile contracts: npx hardhat compile\e[0m"
echo -e "\e[37m4. Run tests: npx hardhat test\e[0m"
echo -e "\e[37m5. Deploy contracts: npx hardhat run scripts/deploy.js --network localhost\e[0m"
echo -e "\e[37m6. Start backend: cd backend && npm run dev\e[0m"
echo -e "\e[37m7. Start frontend: cd frontend && npm run dev\e[0m"
echo ""
echo -e "\e[36mFor detailed instructions, see docs/QUICKSTART.md\e[0m"
echo ""