const mongoose = require('mongoose');

const serviceProviderSchema = new mongoose.Schema({
  providerId: { type: Number, required: true, unique: true },
  address: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  serviceType: { type: String, required: true },
  location: { type: String, required: true },
  contactInfo: String,
  verificationDocHash: String,
  transactionHash: String,
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  totalRedemptions: { type: Number, default: 0 },
  totalAmountRedeemed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now },
  verifiedAt: Date,
}, {
  timestamps: true
});

// Index for better query performance
serviceProviderSchema.index({ status: 1 });
serviceProviderSchema.index({ serviceType: 1 });

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);