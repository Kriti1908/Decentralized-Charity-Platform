const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

/**
 * IPFS Service using Pinata
 * 
 * Setup Instructions:
 * 1. Sign up at https://pinata.cloud
 * 2. Get API Key and Secret from Account page
 * 3. Add to backend/.env:
 *    PINATA_API_KEY=your_api_key_here
 *    PINATA_SECRET_API_KEY=your_secret_key_here
 */

class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
    this.pinataEndpoint = 'https://api.pinata.cloud';
    
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      logger.warn('⚠️  Pinata credentials not found. IPFS upload will not work.');
      logger.warn('   Add PINATA_API_KEY and PINATA_SECRET_API_KEY to .env file');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
      logger.info('✅ Pinata IPFS service configured');
    }
  }

  /**
   * Upload file to IPFS via Pinata
   * @param {Buffer} fileBuffer - File buffer to upload
   * @param {string} fileName - Name of the file
   * @param {object} metadata - Optional metadata
   * @returns {Promise<string>} - IPFS hash (CID)
   */
  async uploadFile(fileBuffer, fileName, metadata = {}) {
    if (!this.isConfigured) {
      throw new Error('Pinata is not configured. Please add API keys to .env');
    }

    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);

      // Add metadata
      const pinataMetadata = JSON.stringify({
        name: fileName,
        keyvalues: metadata,
      });
      formData.append('pinataMetadata', pinataMetadata);

      // Pinning options
      const pinataOptions = JSON.stringify({
        cidVersion: 1, // Use CIDv1 (starts with 'Qm')
      });
      formData.append('pinataOptions', pinataOptions);

      const response = await axios.post(
        `${this.pinataEndpoint}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const ipfsHash = response.data.IpfsHash;
      logger.info(`📁 File uploaded to IPFS: ${ipfsHash}`);
      
      return ipfsHash;
    } catch (error) {
      logger.error('IPFS upload failed:', error.message);
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload JSON data to IPFS
   * @param {object} data - JSON data to upload
   * @param {string} name - Name for the JSON file
   * @returns {Promise<string>} - IPFS hash (CID)
   */
  async uploadJSON(data, name = 'data.json') {
    if (!this.isConfigured) {
      throw new Error('Pinata is not configured. Please add API keys to .env');
    }

    try {
      const response = await axios.post(
        `${this.pinataEndpoint}/pinning/pinJSONToIPFS`,
        {
          pinataContent: data,
          pinataMetadata: {
            name: name,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      logger.info(`📝 JSON uploaded to IPFS: ${ipfsHash}`);
      
      return ipfsHash;
    } catch (error) {
      logger.error('IPFS JSON upload failed:', error.message);
      throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
    }
  }

  /**
   * Retrieve content from IPFS
   * @param {string} hash - IPFS hash (CID)
   * @returns {Promise<any>} - Content from IPFS
   */
  async getContent(hash) {
    try {
      // Using Pinata gateway
      const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      logger.error(`Failed to retrieve IPFS content: ${error.message}`);
      throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
    }
  }

  /**
   * Pin existing IPFS hash to Pinata
   * @param {string} hash - IPFS hash to pin
   * @param {string} name - Name for the pin
   * @returns {Promise<boolean>} - Success status
   */
  async pinByHash(hash, name = 'pinned-content') {
    if (!this.isConfigured) {
      throw new Error('Pinata is not configured. Please add API keys to .env');
    }

    try {
      await axios.post(
        `${this.pinataEndpoint}/pinning/pinByHash`,
        {
          hashToPin: hash,
          pinataMetadata: {
            name: name,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      logger.info(`📌 Pinned existing hash: ${hash}`);
      return true;
    } catch (error) {
      logger.error(`Failed to pin hash: ${error.message}`);
      return false;
    }
  }

  /**
   * Unpin content from Pinata
   * @param {string} hash - IPFS hash to unpin
   * @returns {Promise<boolean>} - Success status
   */
  async unpin(hash) {
    if (!this.isConfigured) {
      throw new Error('Pinata is not configured');
    }

    try {
      await axios.delete(
        `${this.pinataEndpoint}/pinning/unpin/${hash}`,
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      logger.info(`🗑️  Unpinned: ${hash}`);
      return true;
    } catch (error) {
      logger.error(`Failed to unpin: ${error.message}`);
      return false;
    }
  }

  /**
   * Get gateway URL for IPFS hash
   * @param {string} hash - IPFS hash
   * @returns {string} - Gateway URL
   */
  getGatewayURL(hash) {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  /**
   * Test Pinata connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const response = await axios.get(
        `${this.pinataEndpoint}/data/testAuthentication`,
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      logger.info('✅ Pinata connection successful');
      return true;
    } catch (error) {
      logger.error('❌ Pinata connection failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new IPFSService();
