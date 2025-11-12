# Setup Script for Blockchain Charity Platform
# Run this script in PowerShell

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Blockchain Charity Platform Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0 -or -not $nodeVersion) {
    Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js $nodeVersion installed" -ForegroundColor Green

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0 -or -not $npmVersion) {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm $npmVersion installed" -ForegroundColor Green

# Check Git installation
Write-Host "Checking Git installation..." -ForegroundColor Yellow
$gitVersion = git --version 2>$null
if ($LASTEXITCODE -ne 0 -or -not $gitVersion) {
    Write-Host "✗ Git not found. Please install Git from https://git-scm.com/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ $gitVersion installed" -ForegroundColor Green

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install root dependencies
Write-Host "1/3 Installing smart contract dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install smart contract dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Smart contract dependencies installed" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "2/3 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Install backend dependencies
Write-Host "3/3 Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Setup environment files
Write-Host "Setting up environment files..." -ForegroundColor Yellow

# Root .env
if (-Not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file (root)" -ForegroundColor Green
    Write-Host "  ⚠ Please update .env with your configuration" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists (root)" -ForegroundColor Green
}

# Frontend .env.local
if (-Not (Test-Path "frontend\.env.local")) {
    Copy-Item "frontend\.env.example" "frontend\.env.local"
    Write-Host "✓ Created .env.local file (frontend)" -ForegroundColor Green
    Write-Host "  ⚠ Please update frontend\.env.local with your configuration" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env.local file already exists (frontend)" -ForegroundColor Green
}

# Backend .env
if (-Not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✓ Created .env file (backend)" -ForegroundColor Green
    Write-Host "  ⚠ Please update backend\.env with your configuration" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists (backend)" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update .env files with your configuration" -ForegroundColor White
Write-Host "2. Ensure MongoDB is running" -ForegroundColor White
Write-Host "3. Compile contracts: npx hardhat compile" -ForegroundColor White
Write-Host "4. Run tests: npx hardhat test" -ForegroundColor White
Write-Host "5. Deploy contracts: npx hardhat run scripts/deploy.js --network localhost" -ForegroundColor White
Write-Host "6. Start backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "7. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see docs/QUICKSTART.md" -ForegroundColor Cyan
Write-Host ""
