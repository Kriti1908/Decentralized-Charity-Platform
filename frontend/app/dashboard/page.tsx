'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { formatEther, formatAddress, getNGOStatus } from '@/lib/utils';

// Enhanced hook for NGO campaigns
const useNgoCampaigns = (ngoAddress: string | undefined) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!ngoAddress) {
        setCampaigns([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch from backend API
        const response = await fetch(`${apiUrl}/campaigns?ngoAddress=${ngoAddress}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setCampaigns(data.campaigns || []);
        } else {
          throw new Error(data.error || 'Failed to fetch campaigns');
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [ngoAddress]);

  console.log("campaigns", campaigns);

  return { campaigns, loading, error };
};

// Governance proposals hook
const useGovernanceProposals = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  useEffect(() => {
    const fetchProposals = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/governance/proposals`);
        const data = await response.json();
        
        if (data.success) {
          setProposals(data.proposals || []);
        } else {
          throw new Error(data.error || 'Failed to fetch proposals');
        }
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch proposals');
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  return { proposals, loading, error };
};

export default function EnhancedDashboardPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'governance' | 'beneficiaries'>('overview');

  // Get NGO data
  const { data: ngoData } = useReadContract({
    ...CONTRACTS.NGORegistry,
    functionName: 'getNGOByAddress',
    args: address ? [address] : undefined,
  });

  // Get governance reputation
  const { data: reputationData } = useReadContract({
    ...CONTRACTS.NGOGovernance,
    functionName: 'getUserReputation',
    args: address ? [address] : undefined,
  });

  // Get campaigns
  const { campaigns, loading: campaignsLoading } = useNgoCampaigns(address);

  // Get governance proposals
  const { proposals, loading: proposalsLoading } = useGovernanceProposals();

  // Get beneficiary tokens
  // Get campaign tokens for all campaigns
  const [campaignTokens, setCampaignTokens] = useState<{[campaignId: string]: any[]}>({});

  useEffect(() => {
    const fetchCampaignTokens = async () => {
      if (!campaigns.length) return;
      
      const tokens: {[campaignId: string]: any[]} = {};
      
      for (const campaign of campaigns) {
        try {
          const tokensForCampaign = await CONTRACTS.SoulboundToken.read.getCampaignTokens([BigInt(campaign.id)]);
          tokens[campaign.id] = tokensForCampaign || [];
        } catch (error) {
          console.error(`Error fetching tokens for campaign ${campaign.id}:`, error);
          tokens[campaign.id] = [];
        }
      }
      
      setCampaignTokens(tokens);
    };

    fetchCampaignTokens();
  }, [campaigns]);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Please connect your wallet to access your dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add this check - if user is not an NGO, show registration options
  if (!ngoData || (ngoData as any)[0] === 0) { // Check if NGO data doesn't exist or ngoId is 0
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏛️</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">NGO Registration Required</h2>
                <p className="text-gray-600 mb-6">
                  You need to register as an NGO to access the full dashboard features.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
                <div className="p-6 border border-gray-200 rounded-lg text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🎯</span>
                  </div>
                  <h3 className="font-semibold mb-2">Create Campaigns</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Launch fundraising campaigns for your charitable causes
                  </p>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-lg text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🎫</span>
                  </div>
                  <h3 className="font-semibold mb-2">Issue Tokens</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Provide beneficiaries with entitlement tokens for services
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register-ngo"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Register as NGO
                </Link>
                <Link
                  href="/beneficiary/dashboard"
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Go to Beneficiary Dashboard
                </Link>
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                Connected wallet: {formatAddress(address!)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ngo = ngoData as any;
  const isVerified = ngo?.status === 1;
  const reputation = reputationData as any;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {formatAddress(address!)}</p>
        
        {/* Governance Reputation Badge */}
        {reputation && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            🏛️ Governance Reputation: {reputation.reputationScore?.toString() || '0'}/1000
          </div>
        )}
      </div>

      {/* NGO Status Banner */}
      {ngo && (
        <Card className="mb-8">
          <CardContent className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">{ngo.name}</h3>
              <p className="text-gray-600">
                Status:{' '}
                <span className={`font-medium ${isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {getNGOStatus(ngo.status)}
                </span>
              </p>
              {ngo.registrationDate && (
                <p className="text-sm text-gray-500 mt-1">
                  Registered on: {new Date(Number(ngo.registrationDate) * 1000).toLocaleDateString()}
                </p>
              )}
            </div>
            {isVerified && (
              <div className="flex gap-3">
                <Link
                  href="/create-campaign"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Campaign
                </Link>
                <Link
                  href="/issue-token"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Issue Token
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {ngo && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-1">Reputation Score</p>
              <p className="text-3xl font-bold text-blue-600">{ngo.reputationScore?.toString() || '0'}</p>
              <p className="text-xs text-gray-500 mt-1">out of 1000</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-1">Total Campaigns</p>
              <p className="text-3xl font-bold text-blue-600">{campaigns.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-1">Funds Raised</p>
              <p className="text-3xl font-bold text-blue-600">
                {ngo.totalFundsRaised ? formatEther(ngo.totalFundsRaised) : '0'} ETH
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-1">Governance Power</p>
              <p className="text-3xl font-bold text-purple-600">
                {reputation ? (Number(reputation.reputationScore) * 10 / 100) : '0'}x
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'campaigns', name: 'My Campaigns' },
            { id: 'governance', name: 'Governance' },
            { id: 'beneficiaries', name: 'Beneficiaries' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <p>Loading campaigns...</p>
                ) : campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.slice(0, 5).map((campaign) => {
                      const raisedEth = formatEther(campaign.raisedAmount);
                      const targetEth = campaign.targetAmount;
                      const progressPercentage = Math.min((Number(raisedEth) / Number(targetEth)) * 100, 100);
                      
                      return (
                        <div key={campaign.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{campaign.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Raised: {Number(raisedEth).toFixed(2)} ETH / {Number(targetEth).toFixed(2)} ETH
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${progressPercentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No campaigns yet.</p>
                )}
                {campaigns.length > 5 && (
                  <Link
                    href="/campaigns"
                    className="block text-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Campaigns
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Governance Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Governance Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {proposalsLoading ? (
                  <p>Loading proposals...</p>
                ) : proposals.length > 0 ? (
                  <div className="space-y-4">
                    {proposals.slice(0, 5).map((proposal) => (
                      <div key={proposal.proposalId} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-sm">{proposal.description}</h4>
                        <div className="flex justify-between text-xs text-gray-600 mt-2">
                          <span>Votes For: {proposal.votesFor}</span>
                          <span>Votes Against: {proposal.votesAgainst}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Ends: {new Date(proposal.endTime * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No active proposals.</p>
                )}
                <Link
                  href="/governance"
                  className="block text-center mt-4 text-purple-600 hover:text-purple-700 font-medium"
                >
                  View Governance
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <Card>
            <CardHeader>
              <CardTitle>My Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <p>Loading campaigns...</p>
              ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{campaign.title}</h3>
                          <p className="text-gray-600 mt-2">{campaign.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          campaign.status === 0 ? 'bg-green-100 text-green-800' :
                          campaign.status === 1 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status === 0 ? 'Active' : campaign.status === 1 ? 'Completed' : 'Cancelled'}
                        </span>
                      </div>
                      
                      <div className="mt-4 grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Target Amount</p>
                          <p className="font-semibold">{(campaign.targetAmount)} ETH</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Raised Amount</p>
                          <p className="font-semibold">{formatEther(campaign.raisedAmount)} ETH</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Donors</p>
                          <p className="font-semibold">{campaign.totalDonors?.toString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">End Date</p>
                          <p className="font-semibold">
                            {new Date(campaign.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-3">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                        {campaign.status === 0 && (
                          <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                            Issue Tokens
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">You haven't created any campaigns yet.</p>
                  <Link
                    href="/create-campaign"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Campaign
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'governance' && (
          <Card>
            <CardHeader>
              <CardTitle>Governance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Your Governance Status</h3>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-purple-600">Reputation Score</p>
                    <p className="font-bold text-lg">{reputation?.reputationScore?.toString() || '0'}/1000</p>
                  </div>
                  <div>
                    <p className="text-purple-600">Total Votes</p>
                    <p className="font-bold text-lg">{reputation?.totalVotes?.toString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-purple-600">Successful Proposals</p>
                    <p className="font-bold text-lg">{reputation?.successfulProposals?.toString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-purple-600">Vote Weight</p>
                    <p className="font-bold text-lg">
                      {reputation ? (Number(reputation.reputationScore) * 10 / 100) : '0'}x
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Active Proposals</h3>
                <Link
                  href="/governance/create-proposal"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Create Proposal
                </Link>
              </div>

              {proposalsLoading ? (
                <p>Loading proposals...</p>
              ) : proposals.length > 0 ? (
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <div key={proposal.proposalId} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-semibold">{proposal.description}</h4>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {proposal.proposalType === 0 ? 'Verify NGO' : 
                           proposal.proposalType === 1 ? 'Challenge NGO' : 'Suspend NGO'}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">Proposer</p>
                          <p className="font-medium">{formatAddress(proposal.proposer)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">NGO ID</p>
                          <p className="font-medium">#{proposal.ngoId}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Voting Ends</p>
                          <p className="font-medium">
                            {new Date(proposal.endTime * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>For: {proposal.votesFor} votes</span>
                          <span>Against: {proposal.votesAgainst} votes</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{
                              width: `${proposal.votesFor + proposal.votesAgainst > 0 
                                ? (proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100 
                                : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                          Vote For
                        </button>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                          Vote Against
                        </button>
                        <Link
                          href={`/governance/proposal/${proposal.proposalId}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No active proposals at the moment.</p>
                  <Link
                    href="/governance/create-proposal"
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Create the First Proposal
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'beneficiaries' && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="space-y-6">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id}>
                      <h3 className="font-semibold text-lg mb-3">
                        {campaign.title} - Tokens ({campaignTokens[campaign.id]?.length || 0})
                      </h3>
                      {campaignTokens[campaign.id] && campaignTokens[campaign.id].length > 0 ? (
                        <div className="space-y-3 ml-4">
                          {campaignTokens[campaign.id].map((tokenId) => (
                            <BeneficiaryTokenCard key={tokenId.toString()} tokenId={tokenId} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 ml-4">No tokens issued for this campaign yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No campaigns created yet.</p>
                  <Link
                    href="/create-campaign"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Campaign
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Component for individual beneficiary token
function BeneficiaryTokenCard({ tokenId }: { tokenId: bigint }) {
  const { data: tokenMetadata } = useReadContract({
    ...CONTRACTS.SoulboundToken,
    functionName: 'getTokenMetadata',
    args: [tokenId],
  });

  if (!tokenMetadata) return null;

  const metadata = tokenMetadata as any;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">Token #{tokenId.toString()}</h4>
          <p className="text-sm text-gray-600 mt-1">
            Beneficiary: {formatAddress(metadata.beneficiary)}
          </p>
          <p className="text-sm text-gray-600">
            Service: {metadata.serviceType}
          </p>
          <p className="text-sm text-gray-600">
            Amount: {formatEther(metadata.entitledAmount)} ETH
          </p>
          {campaignName && (
            <p className="text-sm text-gray-600">
              Campaign: {campaignName}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          metadata.status === 0 ? 'bg-green-100 text-green-800' :
          metadata.status === 1 ? 'bg-blue-100 text-blue-800' :
          metadata.status === 2 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {metadata.status === 0 ? 'Active' :
           metadata.status === 1 ? 'Redeemed' :
           metadata.status === 2 ? 'Expired' : 'Revoked'}
        </span>
      </div>
      {metadata.isRedeemed && (
        <div className="mt-2 text-sm">
          <p className="text-gray-600">
            Redeemed by: {formatAddress(metadata.redeemedBy)}
          </p>
          <p className="text-gray-600">
            Redeemed on: {new Date(Number(metadata.redeemedAt) * 1000).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}