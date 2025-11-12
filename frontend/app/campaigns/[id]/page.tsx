'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { formatEther, formatDate, calculateProgress, daysUntil, formatAddress } from '@/lib/utils';

interface CampaignDetailPageProps {
  params: { id: string };
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = params; // No longer a Promise in Next.js 14
  const { address, isConnected } = useAccount();
  const [donationAmount, setDonationAmount] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get campaign details
  const { data: campaign, refetch } = useReadContract({
    ...CONTRACTS.CampaignFactory,
    functionName: 'getCampaign',
    args: [BigInt(id)],
  });

  // Fetch recent donations from backend
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/donations/campaign/${id}`);
        if (response.ok) {
          const data = await response.json();
          setRecentDonations(data.slice(0, 5)); // Show last 5 donations
        }
      } catch (error) {
        console.error('Failed to fetch donations:', error);
      }
    };

    if (id) {
      fetchDonations();
    }
  }, [id, donationSuccess]);

  // Donate
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleDonate = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    try {
      writeContract({
        ...CONTRACTS.CampaignFactory,
        functionName: 'donate',
        args: [BigInt(id)],
        value: parseEther(donationAmount),
      });
    } catch (error: any) {
      console.error('Donation error:', error);
      alert(error.message || 'Failed to donate');
    }
  };

  // Refetch after successful donation
  useEffect(() => {
    if (isSuccess) {
      refetch();
      setDonationAmount('');
      setDonationSuccess(true);
      setTimeout(() => setDonationSuccess(false), 5000);
    }
  }, [isSuccess, refetch]);

  // Show loading state until client-side rendering is complete
  if (!isClient) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-center text-gray-500">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-center text-gray-500">Loading campaign...</p>
      </div>
    );
  }

  const progress = calculateProgress((campaign as any).raisedAmount, (campaign as any).targetAmount);
  const daysLeft = daysUntil(Number((campaign as any).deadline));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <span className="px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {(campaign as any).category}
                </span>
                <span className="text-gray-500 text-sm">
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Campaign ended'}
                </span>
              </div>
              <CardTitle className="text-3xl mb-4">{(campaign as any).title}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{(campaign as any).description}</p>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-2xl font-bold">{formatEther((campaign as any).raisedAmount)} ETH</span>
                  <span className="text-gray-600">of {formatEther((campaign as any).targetAmount)} ETH</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{progress}% funded</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-gray-600 text-sm">Beneficiaries</p>
                  <p className="text-2xl font-bold">{(campaign as any).beneficiaryCount?.toString() || '0'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Milestones</p>
                  <p className="text-2xl font-bold">{(campaign as any).milestoneCount?.toString() || '0'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Created</p>
                  <p className="text-sm font-medium">{formatDate(Number((campaign as any).createdAt))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NGO Info */}
          <Card>
            <CardHeader>
              <CardTitle>About the NGO</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Address:</span>{' '}
                <span className="font-mono text-sm">{formatAddress((campaign as any).ngoAddress)}</span>
              </p>
              <p className="text-gray-600 text-sm">
                This campaign is managed by a verified NGO on our platform.
              </p>
            </CardContent>
          </Card>

          {/* Recent Donations */}
          {recentDonations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDonations.map((donation, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">💙</span>
                        </div>
                        <div>
                          <p className="font-mono text-sm text-gray-600">
                            {formatAddress(donation.donor)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(new Date(donation.timestamp).getTime() / 1000)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {formatEther(donation.amount)} ETH
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Donation */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Support This Campaign</CardTitle>
            </CardHeader>

            <CardContent>
              {isConnected ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Amount (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.1"
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-3 gap-2">
                    {['0.1', '0.5', '1.0'].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setDonationAmount(amount)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        {amount} ETH
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleDonate}
                    disabled={!donationAmount || isPending || isConfirming}
                    loading={isPending || isConfirming}
                    className="w-full"
                    variant="success"
                  >
                    {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Donate Now'}
                  </Button>

                  {isSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Thank you for your donation!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">Connect your wallet to donate</p>
                  <p className="text-sm text-gray-500">
                    You'll need a Web3 wallet to support this campaign
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="mt-6 pt-6 border-t space-y-3 text-sm text-gray-600">
                <p>🔒 All donations are secure and transparent</p>
                <p>📊 Track your donation on the blockchain</p>
                <p>✅ Funds go directly to verified beneficiaries</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}