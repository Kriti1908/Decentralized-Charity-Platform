const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  campaignId: {
    type: Number,
    required: true,
    unique: true,
  },
  ngoId: {
    type: Number,
    required: true,
  },
  ngoAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  targetAmount: {
    type: String,
    required: true,
  },
  raisedAmount: {
    type: String,
    default: '0',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'failed', 'paused'],
    default: 'active',
  },
  totalDonors: {
    type: Number,
    default: 0,
  },
  totalBeneficiaries: {
    type: Number,
    default: 0,
  },
  documentsHash: {
    type: String,
    required: true,
  },
  transactionHash: {
    type: String,
    required: true,
  },
  images: [{
    type: String,
  }],
  milestones: [{
    description: String,
    targetAmount: String,
    deadline: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'failed'],
      default: 'pending',
    },
    proofHash: String,
    completedAt: Date,
  }],
  updates: [{
    title: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

campaignSchema.index({ ngoAddress: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Campaign', campaignSchema);