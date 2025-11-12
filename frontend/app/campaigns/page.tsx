'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';

// Types for Campaign data
interface Campaign {
  campaignId: number;
  ngoId: number;
  ngoAddress: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  status: string; // 'active' | 'completed' | 'cancelled' | 'pending'
  documentsHash: string;
  images: string[];
  updates: Array<{
    title: string;
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface NGO {
  name: string;
  reputationScore: number;
  totalCampaigns: number;
}

interface CampaignWithNGO extends Campaign {
  ngo?: NGO;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithNGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Fetch all campaigns from backend
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/campaigns');
        
        if (!response.ok) {
          throw new Error('Failed to fetch campaigns');
        }
        
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Helper function to calculate progress percentage
  const calculateProgress = (raised: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(Math.round((raised / target) * 100), 100);
  };

  // Helper function to calculate days until deadline
  const daysUntil = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format ETH amount (assuming amount is in wei)
  const formatEther = (amount: number) => {
    return (amount / 1e18).toFixed(2);
  };

  // Filter campaigns based on selected filter
  const filteredCampaigns = campaigns.filter(campaign => {
    switch (filter) {
      case 'active':
        return campaign.status === 'active' && daysUntil(campaign.endDate) > 0;
      case 'completed':
        return campaign.status === 'completed' || daysUntil(campaign.endDate) <= 0;
      default:
        return true;
    }
  });

  // Get status counts for display
  const activeCount = campaigns.filter(c => c.status === 'active' && daysUntil(c.endDate) > 0).length;
  const completedCount = campaigns.filter(c => c.status === 'completed' || daysUntil(c.endDate) <= 0).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Active Campaigns</h1>
        <p className="text-gray-600 text-lg">
          Browse verified campaigns and make a difference today
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Active: {activeCount}
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Completed: {completedCount}
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
            Total: {campaigns.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Campaigns
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Campaign Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.campaignId} 
              campaign={campaign}
              calculateProgress={calculateProgress}
              daysUntil={daysUntil}
              formatAddress={formatAddress}
              formatEther={formatEther}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No campaigns found</p>
            <Link
              href="/create-campaign"
              className="text-blue-600 hover:underline mt-4 inline-block"
            >
              Create the first campaign →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface CampaignCardProps {
  campaign: CampaignWithNGO;
  calculateProgress: (raised: number, target: number) => number;
  daysUntil: (endDate: string) => number;
  formatAddress: (address: string) => string;
  formatEther: (amount: number) => string;
}

function CampaignCard({ campaign, calculateProgress, daysUntil, formatAddress, formatEther }: CampaignCardProps) {
  const progress = calculateProgress(campaign.raisedAmount, campaign.targetAmount);
  const daysLeft = daysUntil(campaign.endDate);
  const isActive = campaign.status === 'active' && daysLeft > 0;

  return (
    <Link href={`/campaigns/${campaign.campaignId}`}>
      <Card hover className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {campaign.category}
            </span>
            <span className={`text-sm font-medium ${
              isActive ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isActive ? `${daysLeft} days left` : 'Ended'}
            </span>
          </div>
          <CardTitle className="text-lg">{campaign.title}</CardTitle>
        </CardHeader>

        <CardContent className="flex-grow">
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {campaign.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-sm mb-4">
            <div>
              <p className="text-gray-600">Raised</p>
              <p className="font-bold text-lg">{formatEther(campaign.raisedAmount)} ETH</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Goal</p>
              <p className="font-bold text-lg">{formatEther(campaign.targetAmount)} ETH</p>
            </div>
          </div>

          {/* NGO Info */}
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <p className="text-gray-600 text-xs mb-1">By</p>
            <div className="flex justify-between items-center">
              <p className="font-medium text-sm">
                {campaign.ngo?.name || formatAddress(campaign.ngoAddress)}
              </p>
              {campaign.ngo && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {campaign.ngo.reputationScore}/1000
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}