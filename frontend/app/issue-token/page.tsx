'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useRouter } from 'next/navigation';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';

export default function IssueTokenPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  console.log('User address:', address);
  console.log('Is connected:', isConnected);
  
  const [formData, setFormData] = useState({
    beneficiaryAddress: '',
    campaignId: '',
    serviceType: '',
    entitledAmount: '',
    validityDays: '90', // Default 90 days
  });

  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Get NGO data to verify user is an NGO
  const { data: ngoData } = useReadContract({
    ...CONTRACTS.NGORegistry,
    functionName: 'getNGOByAddress',
    args: address ? [address] : undefined,
  });

  // Get campaigns created by this NGO
  const { data: campaignIds } = useReadContract({
    ...CONTRACTS.CampaignFactory,
    functionName: 'getCampaignsByNGO',
    args: address ? [address] : undefined,
  });

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

  // Success redirect
  useEffect(() => {
    if (isSuccess) {
      alert('✅ Token issued successfully!\\n\\nThe beneficiary can now use this token to receive services.');
      router.push('/dashboard');
    }
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isConnected || !address) {
      alert('⚠️ Please connect your wallet first!');
      return;
    }

    if (!ngoData || (ngoData as any).status !== 1) { // status !== Verified
      alert('⚠️ Only verified NGOs can issue tokens!\\n\\nPlease wait for your NGO to be verified.');
      return;
    }

    if (!formData.beneficiaryAddress || !formData.campaignId || !formData.serviceType || !formData.entitledAmount) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.beneficiaryAddress)) {
      alert('Invalid beneficiary address. Please enter a valid Ethereum address.');
      return;
    }

    if (parseFloat(formData.entitledAmount) <= 0) {
      alert('Entitled amount must be greater than 0');
      return;
    }

    try {
      // Convert days to seconds
      const validityPeriod = BigInt(parseInt(formData.validityDays)) * BigInt(86400);

      console.log("Issuing token with data:", formData, "Validity period (s):", validityPeriod);
      console.log("entitlement: ", parseEther(formData.entitledAmount));

      writeContract({
        ...CONTRACTS.CampaignFactory,
        functionName: 'issueBeneficiaryToken',
        args: [
          BigInt(formData.campaignId),
          formData.beneficiaryAddress as `0x${string}`,
          parseEther(formData.entitledAmount),
          formData.serviceType,
          validityPeriod,
        ],
      });
    } catch (error: any) {
      console.error('Error issuing token:', error);
      alert(error.message || 'Failed to issue token');
    }
  };

  // Not connected
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Please connect your wallet to issue tokens to beneficiaries
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('NGO Data:', ngoData);
  // console.log("nnn: ", ngoData ? (ngoData as any).status : 'No NGO data');

  // Not an NGO or not verified
  if (!ngoData || (ngoData as any).status !== 1) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4 text-yellow-500">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">NGO Verification Required</h2>
              <p className="text-gray-600 mb-6">
                Only verified NGOs can issue tokens to beneficiaries.
                {!ngoData ? ' Please register as an NGO first.' : 
                 ((ngoData as any)[9] !== 1 ? ' Your NGO is pending verification.' : '')}
              </p>
              {!ngoData && (
                <Button onClick={() => router.push('/register-ngo')}>
                  Register as NGO
                </Button>
              )}
              {(ngoData && (ngoData as any)[9] !== 1) ? (
                <p className="text-sm text-gray-500">
                  Please wait for admin verification. This usually takes 1-2 business days.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Issue Beneficiary Token</h1>
        <p className="mt-2 text-gray-600">
          Issue a Soulbound Token to a beneficiary, granting them entitlement to specific services.
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Soulbound Tokens</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Tokens are NON-TRANSFERABLE (bound to beneficiary)</li>
                <li>Represent entitlement to specific services</li>
                <li>Can only be redeemed by authorized service providers</li>
                <li>Expire after validity period if not redeemed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Beneficiary Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.beneficiaryAddress}
                onChange={(e) => setFormData({ ...formData, beneficiaryAddress: e.target.value })}
                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                The Ethereum address of the person who will receive services
              </p>
            </div>

            {/* Campaign Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Campaign <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select a Campaign --</option>
                {campaignIds ? (campaignIds as bigint[]).map((id) => (
                  <option key={id.toString()} value={id.toString()}>
                    Campaign #{id.toString()}
                  </option>
                )) : null}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Token will be linked to this campaign's funds
              </p>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                placeholder="e.g., Eye Surgery, School Fees, Medical Treatment"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                What service will this token cover?
              </p>
            </div>

            {/* Entitled Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entitled Amount (ETH) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.entitledAmount}
                onChange={(e) => setFormData({ ...formData, entitledAmount: e.target.value })}
                placeholder="e.g., 0.5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                How much ETH is this beneficiary entitled to?
              </p>
            </div>

            {/* Validity Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validity Period (Days) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.validityDays}
                onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="30">30 Days (1 Month)</option>
                <option value="60">60 Days (2 Months)</option>
                <option value="90">90 Days (3 Months)</option>
                <option value="180">180 Days (6 Months)</option>
                <option value="365">365 Days (1 Year)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Token expires if not redeemed within this period
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isPending || isConfirming}
                className="flex-1"
              >
                {isPending && 'Waiting for approval...'}
                {isConfirming && 'Confirming transaction...'}
                {!isPending && !isConfirming && '🎫 Issue Token to Beneficiary'}
              </Button>
              
              <Button
                type="button"
                onClick={() => router.push('/dashboard')}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>

            {/* Transaction Status */}
            {(isPending || isConfirming) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                      {isConfirming && 'Transaction confirming on blockchain...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
