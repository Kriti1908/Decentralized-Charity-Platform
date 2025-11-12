const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

/**
 * @route   POST /api/auth/login
 * @desc    Web3 signature-based login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { address: address.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      address: address.toLowerCase(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      valid: true,
      address: decoded.address,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
