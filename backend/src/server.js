const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const BlockchainSync = require('./services/blockchainSync');

// Import routes
const authRoutes = require('./routes/auth');
const ngoRoutes = require('./routes/ngo');
const campaignRoutes = require('./routes/campaign');
const donationRoutes = require('./routes/donation');
const beneficiaryRoutes = require('./routes/beneficiary');
const providerRoutes = require('./routes/provider');
const ipfsRoutes = require('./routes/ipfs');
const governanceRoutes = require('./routes/governance');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/governance', governanceRoutes);


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

// Start blockchain listener
const blockchainSync = new BlockchainSync();
blockchainSync.startListening();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
