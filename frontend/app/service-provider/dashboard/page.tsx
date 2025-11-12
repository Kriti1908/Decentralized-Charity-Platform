'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { formatEther, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

// Custom hook to fetch service provider tokens
const useServiceProviderTokens = (providerAddress: string | undefined) => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!providerAddress) {
        setTokens([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // First get tokens from backend (if any)
        const response = await api.getServiceProviderTokens(providerAddress);
        
        if (response.success) {
          // If backend returns tokens, use them
          setTokens(response.tokens || []);
        } else {
          // If no backend tokens, we'll fetch from blockchain directly
          setTokens([]);
        }
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [providerAddress]);

  console.log("TOkens: ", tokens);

  return { tokens, loading, error };
};

export default function ServiceProviderDashboardPage() {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [proofHash, setProofHash] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Get provider data from blockchain
  const { data: providerData } = useReadContract({
    ...CONTRACTS.ServiceProviderRegistry,
    functionName: 'getProviderByAddress',
    args: address ? [address] : undefined,
  });

  // Get tokens for this provider
  const { tokens, loading: tokensLoading, error: tokensError } = useServiceProviderTokens(address);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { 
    isLoading: isConfirming, 
    isSuccess, 
    isError: receiptError,
    error: receiptErrorDetail 
  } = useWaitForTransactionReceipt({ hash });

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      alert(`Transaction failed: ${writeError.message}`);
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      console.error('Transaction receipt error:', receiptErrorDetail);
      alert(`Transaction failed: ${receiptErrorDetail?.message || 'Unknown error'}`);
    }
  }, [receiptError, receiptErrorDetail]);

  // Success handling - Update backend after successful redemption
  useEffect(() => {
    if (isSuccess && hash && selectedToken) {
      const recordRedemption = async () => {
        try {
          // Record redemption in backend
          await api.recordServiceProviderRedemption(
            address!, 
            parseFloat(selectedToken.entitledAmount)
          );
          
          alert('✅ Token redeemed successfully!\\n\\nFunds have been transferred to your wallet and recorded in database.');
          setShowRedeemModal(false);
          setSelectedToken(null);
          setProofHash('');
        } catch (error) {
          console.error('Error recording redemption in backend:', error);
          alert('✅ Token redeemed on blockchain, but failed to update database. Please contact support.');
        }
      };

      recordRedemption();
    }
  }, [isSuccess, hash, selectedToken, address]);

  const handleRedeem = async () => {
    if (!selectedToken || !proofHash) {
      alert('Please upload proof of service');
      return;
    }

    try {
      writeContract({
        ...CONTRACTS.SoulboundToken,
        functionName: 'redeemToken',
        args: [
          BigInt(selectedToken.tokenId),
          proofHash,
        ],
      });
    } catch (error: any) {
      console.error('Error redeeming token:', error);
      alert(error.message || 'Failed to redeem token');
    }
  };

  // Fetch real tokens from blockchain (you'll need to implement this based on your contract)
  // For now, we'll create a function to fetch tokens that this provider can redeem
  const fetchAvailableTokensFromBlockchain = async (providerAddress: string) => {
    // This is a placeholder - you'll need to implement based on your contract structure
    // You might need to:
    // 1. Get all tokens from SoulboundToken contract
    // 2. Filter tokens where serviceType matches provider's serviceType
    // 3. Check if tokens are active and not expired
    
    return []; // Return empty array for now
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Please connect your wallet to access your service provider dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if provider is registered and verified
  const provider = providerData as any;
  // console.log('Provider Data:', provider);
  const isProviderVerified = provider && provider.status === 1; // status === 1 means verified
  const isProviderPending = provider && provider.status === 0; // status === 0 means pending

  if (!providerData || (providerData as any)[0] === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4 text-yellow-500">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Service Provider Registration Required</h2>
              <p className="text-gray-600 mb-6">
                You need to register as a service provider to access this dashboard.
              </p>
              <Button onClick={() => window.location.href = '/service-provider/register'}>
                Register Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Service Provider Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage beneficiary tokens and provide services
        </p>
      </div>

      {/* Provider Status Banner */}
      {!isProviderVerified && (
        <Card className="mb-8 border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {isProviderPending ? 'Verification Pending' : 'Account Issue'}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {isProviderPending 
                      ? 'Your service provider account is pending verification. You will be able to redeem tokens once verified.'
                      : 'There is an issue with your service provider account. Please contact support.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Organization Name</p>
              <p className="text-lg font-semibold">{provider[1] || 'Provider Name'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-lg font-semibold">{provider[2] || 'Healthcare'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                isProviderVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isProviderVerified ? '✅ Verified' : '⏳ Pending Verification'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Available Tokens</p>
                <p className="text-2xl font-bold text-gray-900">{tokens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Services Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{provider[10] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {provider[11] ? formatEther(provider[11].toString()) : '0'} ETH
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Available Beneficiary Tokens</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            These beneficiaries are entitled to receive services from you
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
              <p className="text-gray-500">No tokens available for redemption</p>
              <p className="text-sm text-gray-400 mt-2">
                {!isProviderVerified 
                  ? 'Complete verification to see available tokens'
                  : 'Tokens will appear here when NGOs issue them to beneficiaries for your service category'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <div key={token.tokenId} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          Token #{token.tokenId}
                        </span>
                        <span className="text-gray-500 text-sm">
                          Campaign #{token.campaignId}: {token.campaignTitle}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Service Type</p>
                          <p className="font-semibold">{token.serviceType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Beneficiary</p>
                          <p className="font-mono text-sm">{token.beneficiary.slice(0, 10)}...</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-semibold text-green-600">{token.entitledAmount} ETH</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expires In</p>
                          <p className="font-semibold">
                            {Math.ceil((token.expiryDate - Date.now()) / (24 * 60 * 60 * 1000))} days
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">
                        Issued: {new Date(token.issuedDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="ml-4">
                      <Button
                        onClick={() => {
                          setSelectedToken(token);
                          setShowRedeemModal(true);
                        }}
                        className="whitespace-nowrap"
                        disabled={!isProviderVerified}
                      >
                        💰 Redeem Token
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeem Token Modal */}
      {showRedeemModal && selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Redeem Beneficiary Token</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Token Details:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-gray-500">Token ID:</span>
                  <span className="ml-2 font-semibold">#{selectedToken.tokenId}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Service:</span>
                  <span className="ml-2 font-semibold">{selectedToken.serviceType}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Amount:</span>
                  <span className="ml-2 font-semibold text-green-600">{selectedToken.entitledAmount} ETH</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Beneficiary:</span>
                  <span className="ml-2 font-mono text-sm">{selectedToken.beneficiary.slice(0, 12)}...</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof of Service (IPFS Hash) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={proofHash}
                onChange={(e) => setProofHash(e.target.value)}
                placeholder="QmXxx... (Upload documents to IPFS first)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500">
                Required: Medical reports, receipts, photos, or other proof that service was delivered
              </p>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> By redeeming this token, you confirm that you have delivered the service to the beneficiary. 
                The smart contract will transfer {selectedToken.entitledAmount} ETH to your wallet.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleRedeem}
                disabled={!proofHash || isPending || isConfirming || !isProviderVerified}
                className="flex-1"
              >
                {isPending && 'Waiting for approval...'}
                {isConfirming && 'Confirming transaction...'}
                {!isPending && !isConfirming && '✅ Confirm & Redeem Token'}
              </Button>
              <Button
                onClick={() => {
                  setShowRedeemModal(false);
                  setSelectedToken(null);
                  setProofHash('');
                }}
                variant="secondary"
                disabled={isPending || isConfirming}
              >
                Cancel
              </Button>
            </div>

            {/* Transaction Status */}
            {(isPending || isConfirming) && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">
                      {isPending && 'Waiting for wallet confirmation...'}
                      {isConfirming && 'Redeeming token and transferring funds...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}