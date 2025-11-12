const cron = require('node-cron');
const NGO = require('../models/NGO');
const Campaign = require('../models/Campaign');
const logger = require('../utils/logger');

class BackgroundSync {
  constructor(blockchainSync) {
    this.blockchainSync = blockchainSync;
  }

  start() {
    // Sync pending NGOs every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Running background NGO sync...');
        const pendingNGOs = await NGO.find({ status: 'pending' });
        
        for (const ngo of pendingNGOs) {
          await this.blockchainSync.syncNGO(ngo.ngoId);
        }
        
        console.log(`Background NGO sync completed for ${pendingNGOs.length} NGOs`);
      } catch (error) {
        logger.error('Background NGO sync error:', error);
      }
    });

    // Sync active campaigns every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      try {
        console.log('Running background campaign sync...');
        const activeCampaigns = await Campaign.find({ status: 'active' });
        
        for (const campaign of activeCampaigns) {
          await this.blockchainSync.updateCampaignRaisedAmount(campaign.campaignId);
        }
        
        console.log(`Background campaign sync completed for ${activeCampaigns.length} campaigns`);
      } catch (error) {
        logger.error('Background campaign sync error:', error);
      }
    });

    // Check and update expired campaigns every hour
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('Checking expired campaigns...');
        const now = new Date();
        const activeCampaigns = await Campaign.find({ 
          status: 'active',
          endDate: { $lt: now }
        });

        for (const campaign of activeCampaigns) {
          await Campaign.findOneAndUpdate(
            { campaignId: campaign.campaignId },
            { 
              status: 'completed',
              updatedAt: new Date()
            }
          );
          console.log(`Marked campaign ${campaign.campaignId} as completed (expired)`);
        }

        console.log(`Expired campaign check completed. Updated ${activeCampaigns.length} campaigns.`);
      } catch (error) {
        logger.error('Error checking expired campaigns:', error);
      }
    });
  }
}

module.exports = BackgroundSync;