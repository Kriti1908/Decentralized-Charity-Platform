const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  ngoId: { type: Number, required: true, unique: true },
  address: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  country: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  website: String,
  email: String,
  phone: String,
  kycDocumentHash: String,
  transactionHash: String, // Add this field
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'suspended', 'blacklisted'],
    default: 'pending'
  },
  reputationScore: { type: Number, default: 500, min: 0, max: 1000 },
  totalCampaigns: { type: Number, default: 0 },
  totalFundsRaised: { type: Number, default: 0 },
  totalBeneficiaries: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now },
  verifiedAt: Date,
}, {
  timestamps: true
});

module.exports = mongoose.model('NGO', ngoSchema);