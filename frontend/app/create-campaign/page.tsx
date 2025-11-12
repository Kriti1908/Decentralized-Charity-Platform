'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useRouter } from 'next/navigation';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    duration: '30', // days
    category: 'Medical',
    documentHash: '',
  });

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { 
    isLoading: isConfirming, 
    isSuccess, 
    isError: receiptError,
    error: receiptErrorDetail 
  } = useWaitForTransactionReceipt({ 
    hash,
  });

  // Add useEffect to handle errors with better messaging
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      
      // Extract user-friendly error message
      let errorMessage = 'Transaction failed';
      const errorString = writeError.message || '';
      
      if (errorString.includes('Only verified NGOs can create campaigns')) {
        errorMessage = '❌ Only Verified NGOs Can Create Campaigns\n\nYour NGO must be verified before creating campaigns.\n\n1. Ensure your NGO is registered\n2. Wait for admin/governance verification\n3. Check verification status at /ngos page';
      } else if (errorString.includes('user rejected')) {
        errorMessage = 'Transaction was rejected in MetaMask';
      } else if (errorString.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
      } else if (errorString.toLowerCase().includes('revert')) {
        // Try to extract revert reason
        const match = errorString.match(/reverted with reason string '([^']+)'/);
        if (match) {
          errorMessage = `Contract Error: ${match[1]}`;
        } else {
          errorMessage = `Transaction reverted: ${errorString.substring(0, 100)}`;
        }
      } else {
        errorMessage = `Transaction failed: ${errorString.substring(0, 150)}`;
      }
      
      alert(errorMessage);
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      console.error('Transaction receipt error:', receiptErrorDetail);
      alert(`Transaction failed: ${receiptErrorDetail?.message || 'Unknown error'}`);
    }
  }, [receiptError, receiptErrorDetail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Submitted');
    
    // Check wallet connection
    if (!isConnected || !address) {
      alert('⚠️ Please connect your wallet first!\n\nClick the "Connect Wallet" button in the top right corner.');
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.targetAmount) {
      alert('Please fill in all required fields: Title, Description, and Target Amount');
      return;
    }

    // Validate target amount
    if (parseFloat(formData.targetAmount) <= 0) {
      alert('Target amount must be greater than 0');
      return;
    }

    console.log("Wallet connected:", isConnected);
    console.log("Wallet address:", address);

    try {
      console.log("CampaignFactory contract:", CONTRACTS.CampaignFactory);
      
      // Convert days to seconds - FIXED
      const durationInSeconds = BigInt(parseInt(formData.duration)) * BigInt(86400);
      
      console.log("Calling writeContract with arguments:", [
        formData.title,                    // string title
        formData.description,              // string description  
        formData.category,                 // string category
        parseEther(formData.targetAmount), // uint256 targetAmount
        durationInSeconds,                 // uint256 duration (in SECONDS)
        formData.documentHash || 'QmDefault', // string documentsHash
      ]);
      
      writeContract({
        ...CONTRACTS.CampaignFactory,
        functionName: 'createCampaign',
        args: [
          formData.title,
          formData.description,
          formData.category,
          parseEther(formData.targetAmount),
          durationInSeconds, // Now in seconds
          formData.documentHash || 'QmDefault',
        ],
      });
      console.log("writeContract called successfully");
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert(error.message || 'Failed to create campaign');
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && hash) {
      console.log("Transaction successful! Hash:", hash);
      
      // Calculate dates for backend
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(formData.duration));

      // Prepare data for backend
      const backendData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        targetAmount: formData.targetAmount,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ngoAddress: address,
        documentsHash: formData.documentHash || 'QmDefault',
        transactionHash: hash,
      };

      console.log('Sending campaign to backend:', backendData);
      
      // Save to backend database
      api.createCampaign(backendData)
      .then((response) => {
        console.log('Backend response:', response);
        alert('Campaign created successfully!');
        router.push('/campaigns');
      })
      .catch(err => {
        console.error('Error saving campaign to database:', err);
        alert('Campaign recorded on blockchain, but failed to save to database. Please contact support.');
        router.push('/campaigns');
      });
    }
  }, [isSuccess, hash, formData, address, router]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create New Campaign</CardTitle>
          <p className="text-gray-600 mt-2">
            Launch a fundraising campaign to help those in need
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Eye Surgery for 50 Children"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Medical">Medical</option>
                <option value="Education">Education</option>
                <option value="Food">Food & Nutrition</option>
                <option value="Housing">Housing</option>
                <option value="Emergency">Emergency Relief</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your campaign, who it will help, and how the funds will be used..."
              />
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount (ETH) *
              </label>
              <input
                type="number"
                required
                step="0.001"
                min="0.001"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 5.0"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Duration (Days) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="365"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 30"
              />
              <p className="text-sm text-gray-500 mt-1">
                Campaign will run for {formData.duration} days ({parseInt(formData.duration) * 24} hours)
              </p>
            </div>

            {/* Document Hash (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Hash (IPFS) - Optional
              </label>
              <input
                type="text"
                value={formData.documentHash}
                onChange={(e) => setFormData({ ...formData, documentHash: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="QmXxx... (IPFS hash of supporting documents)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload supporting documents to IPFS and paste the hash here
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={!isConnected || isPending || isConfirming}
                loading={isPending || isConfirming}
                className="w-full"
              >
                {isPending ? 'Confirming in Wallet...' : isConfirming ? 'Creating Campaign...' : 'Create Campaign'}
              </Button>
            </div>

            {!isConnected && (
              <p className="text-center text-red-600 text-sm">
                Please connect your wallet to create a campaign
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}