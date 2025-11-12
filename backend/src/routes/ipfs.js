const express = require('express');
const router = express.Router();
const multer = require('multer');
const ipfsService = require('../services/ipfsService');

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  },
});

/**
 * @route   POST /api/ipfs/upload
 * @desc    Upload file to IPFS via Pinata
 * @access  Public (should be protected in production)
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const metadata = {
      uploadedBy: req.body.uploadedBy || 'anonymous',
      uploadedAt: new Date().toISOString(),
      description: req.body.description || '',
      category: req.body.category || 'general',
    };

    const ipfsHash = await ipfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      metadata
    );

    res.json({
      success: true,
      ipfsHash,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      gatewayUrl: ipfsService.getGatewayURL(ipfsHash),
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/ipfs/upload-json
 * @desc    Upload JSON data to IPFS
 * @access  Public
 */
router.post('/upload-json', async (req, res) => {
  try {
    const { data, name } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const ipfsHash = await ipfsService.uploadJSON(data, name || 'data.json');

    res.json({
      success: true,
      ipfsHash,
      gatewayUrl: ipfsService.getGatewayURL(ipfsHash),
    });
  } catch (error) {
    console.error('JSON upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/ipfs/:hash
 * @desc    Retrieve content from IPFS
 * @access  Public
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const content = await ipfsService.getContent(hash);
    res.json({ success: true, content });
  } catch (error) {
    console.error('IPFS retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/ipfs/gateway/:hash
 * @desc    Get IPFS gateway URL
 * @access  Public
 */
router.get('/gateway/:hash', (req, res) => {
  const { hash } = req.params;
  const gatewayUrl = ipfsService.getGatewayURL(hash);
  res.json({ success: true, gatewayUrl });
});

/**
 * @route   GET /api/ipfs/test/connection
 * @desc    Test Pinata connection
 * @access  Public
 */
router.get('/test/connection', async (req, res) => {
  try {
    const isConnected = await ipfsService.testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'Pinata connection successful' : 'Pinata connection failed',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
