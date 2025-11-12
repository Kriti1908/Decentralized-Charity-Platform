'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { formatEther, formatAddress } from '@/lib/utils';

// Hook to fetch beneficiary tokens
const useBeneficiaryTokens = (beneficiaryAddress: string | undefined) => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!beneficiaryAddress) {
        setTokens([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch from backend API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/beneficiaries/${beneficiaryAddress}/tokens`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.tokens) {
          setTokens(data.tokens || []);
        } else {
          throw new Error(data.error || 'Failed to fetch tokens');
        }
      } catch (err) {
        console.error('Error fetching beneficiary tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [beneficiaryAddress]);

  return { tokens, loading, error };
};

export default function BeneficiaryDashboardPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens'>('overview');

  // Get beneficiary tokens
  const { tokens, loading: tokensLoading, error: tokensError } = useBeneficiaryTokens(address);

  // Get beneficiary stats
  const { data: beneficiaryStats } = useReadContract({
    ...CONTRACTS.SoulboundToken,
    functionName: 'getBeneficiaryTokens',
    args: address ? [address] : undefined,
  });

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Please connect your wallet to access your beneficiary dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeTokens = tokens.filter(token => 
    token.status === 0 && // Active status
    !token.isRedeemed && 
    Date.now() / 1000 <= token.validUntil
  );

  const redeemedTokens = tokens.filter(token => token.isRedeemed);
  const expiredTokens = tokens.filter(token => 
    !token.isRedeemed && Date.now() / 1000 > token.validUntil
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Beneficiary Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your entitlement tokens and track service redemptions
        </p>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Wallet: {formatAddress(address!)}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="text-center p-6">
            <p className="text-gray-600 text-sm mb-1">Total Tokens</p>
            <p className="text-3xl font-bold text-blue-600">{tokens.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center p-6">
            <p className="text-gray-600 text-sm mb-1">Active Tokens</p>
            <p className="text-3xl font-bold text-green-600">{activeTokens.length}</p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="text-center p-6">
            <p className="text-gray-600 text-sm mb-1">Redeemed</p>
            <p className="text-3xl font-bold text-purple-600">{redeemedTokens.length}</p>
          </CardContent>
        </Card> */}

        <Card>
          <CardContent className="text-center p-6">
            <p className="text-gray-600 text-sm mb-1">Expired</p>
            <p className="text-3xl font-bold text-yellow-600">{expiredTokens.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'tokens', name: 'My Tokens' },
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
            {/* Active Tokens */}
            <Card>
              <CardHeader>
                <CardTitle>Active Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                {tokensLoading ? (
                  <p>Loading tokens...</p>
                ) : activeTokens.length > 0 ? (
                  <div className="space-y-4">
                    {activeTokens.slice(0, 5).map((token) => (
                      <BeneficiaryTokenCard key={token.tokenId} token={token} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No active tokens available.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {tokensLoading ? (
                  <p>Loading activity...</p>
                ) : tokens.length > 0 ? (
                  <div className="space-y-3">
                    {tokens.slice(0, 5).map((token) => (
                      <div key={token.tokenId} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">Token #{token.tokenId}</p>
                          <p className="text-gray-600">
                            {token.isRedeemed ? 'Redeemed' : 'Issued'} • {formatEther(token.entitledAmount)} ETH
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          token.isRedeemed ? 'bg-green-100 text-green-800' :
                          Date.now() / 1000 > token.validUntil ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {token.isRedeemed ? 'Redeemed' : 
                           Date.now() / 1000 > token.validUntil ? 'Expired' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No activity yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tokens' && (
          <Card>
            <CardHeader>
              <CardTitle>My Entitlement Tokens</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                These tokens represent your entitlement to specific services from verified providers
              </p>
            </CardHeader>
            <CardContent>
              {tokensLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : tokensError ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-2">Failed to load tokens</p>
                  <p className="text-gray-600 text-sm">{tokensError}</p>
                </div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No tokens issued to you yet.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Tokens will appear here when NGOs issue them for specific services
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Tokens */}
                  {activeTokens.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-4">Active Tokens ({activeTokens.length})</h3>
                      <div className="space-y-4">
                        {activeTokens.map((token) => (
                          <BeneficiaryTokenCard key={token.tokenId} token={token} showFullDetails={true} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Redeemed Tokens */}
                  {redeemedTokens.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-purple-700 mb-4">Redeemed Tokens ({redeemedTokens.length})</h3>
                      <div className="space-y-4">
                        {redeemedTokens.map((token) => (
                          <BeneficiaryTokenCard key={token.tokenId} token={token} showFullDetails={true} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expired Tokens */}
                  {expiredTokens.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-700 mb-4">Expired Tokens ({expiredTokens.length})</h3>
                      <div className="space-y-4">
                        {expiredTokens.map((token) => (
                          <BeneficiaryTokenCard key={token.tokenId} token={token} showFullDetails={true} />
                        ))}
                      </div>
                    </div>
                  )}
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
function BeneficiaryTokenCard({ token, showFullDetails = false }: { token: any, showFullDetails?: boolean }) {
  const getStatusInfo = (token: any) => {
    if (token.isRedeemed) {
      return { color: 'green', text: 'Redeemed', badge: '✅' };
    } else if (Date.now() / 1000 > token.validUntil) {
      return { color: 'yellow', text: 'Expired', badge: '⏰' };
    } else {
      return { color: 'blue', text: 'Active', badge: '🟢' };
    }
  };

  const statusInfo = getStatusInfo(token);
  const daysUntilExpiry = Math.ceil((token.validUntil - Date.now() / 1000) / (24 * 60 * 60));

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            Token #{token.tokenId}
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
            statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {statusInfo.badge} {statusInfo.text}
          </span>
        </div>
        {!token.isRedeemed && daysUntilExpiry > 0 && (
          <span className="text-sm text-gray-500">
            Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Service Type</p>
          <p className="font-semibold">{token.serviceType}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Entitled Amount</p>
          <p className="font-semibold text-green-600">{formatEther(token.entitledAmount)} ETH</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Campaign</p>
          <p className="font-semibold">#{token.campaignId}</p>
        </div>
      </div>

      {showFullDetails && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-gray-500">Issued Date</p>
              <p>{new Date(Number(token.issuedAt) * 1000).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Expiry Date</p>
              <p>{new Date(Number(token.validUntil) * 1000).toLocaleDateString()}</p>
            </div>
          </div>

          {token.isRedeemed && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-1">Token Redeemed</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-green-600">Redeemed by:</p>
                  <p className="font-mono">{formatAddress(token.redeemedBy)}</p>
                </div>
                <div>
                  <p className="text-green-600">Redeemed on:</p>
                  <p>{new Date(Number(token.redeemedAt) * 1000).toLocaleDateString()}</p>
                </div>
              </div>
              {token.proofOfServiceHash && (
                <div className="mt-2">
                  <p className="text-green-600 text-sm">Proof of Service:</p>
                  <p className="font-mono text-xs break-all">{token.proofOfServiceHash}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!token.isRedeemed && daysUntilExpiry > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800">
            🏥 Present this token to any verified service provider to receive your entitled service
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Service: <strong>{token.serviceType}</strong> • Amount: <strong>{formatEther(token.entitledAmount)} ETH</strong>
          </p>
        </div>
      )}

      {!token.isRedeemed && daysUntilExpiry <= 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">
            ⏰ This token has expired and can no longer be redeemed
          </p>
        </div>
      )}
    </div>
  );
}