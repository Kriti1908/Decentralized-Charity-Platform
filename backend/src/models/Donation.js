const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donationId: {
    type: String,
    unique: true,
    required: true,
  },
  campaignId: {
    type: String,
    required: true,
  },
  donorAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  amount: {
    type: String, // Store as string to handle large numbers
    required: true,
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true,
  },
  blockNumber: {
    type: Number,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'confirmed',
  },
}, {
  timestamps: true,
});

// Corrected compound indexes - using object syntax
donationSchema.index({ campaignId: 1, timestamp: -1 });
donationSchema.index({ donorAddress: 1, timestamp: -1 });
donationSchema.index({ timestamp: -1 });

// Static methods
donationSchema.statics.getTotalDonationsByCampaign = async function(campaignId) {
  const donations = await this.find({ 
    campaignId, 
    status: 'confirmed' 
  });
  
  if (donations.length === 0) {
    return { 
      totalAmount: '0', 
      donationCount: 0, 
      uniqueDonors: [] 
    };
  }

  const totalAmount = donations.reduce((sum, donation) => {
    return sum + BigInt(donation.amount);
  }, BigInt(0));

  const uniqueDonors = [...new Set(donations.map(d => d.donorAddress))];

  return {
    totalAmount: totalAmount.toString(),
    donationCount: donations.length,
    uniqueDonors: uniqueDonors
  };
};

donationSchema.statics.getDonorStats = async function(donorAddress) {
  const donations = await this.find({ 
    donorAddress: donorAddress.toLowerCase(), 
    status: 'confirmed' 
  });
  
  if (donations.length === 0) {
    return { 
      totalDonated: '0', 
      totalDonations: 0, 
      campaignsSupported: [] 
    };
  }

  const totalDonated = donations.reduce((sum, donation) => {
    return sum + BigInt(donation.amount);
  }, BigInt(0));

  const campaignsSupported = [...new Set(donations.map(d => d.campaignId))];

  return {
    totalDonated: totalDonated.toString(),
    totalDonations: donations.length,
    campaignsSupported: campaignsSupported
  };
};

module.exports = mongoose.model('Donation', donationSchema);