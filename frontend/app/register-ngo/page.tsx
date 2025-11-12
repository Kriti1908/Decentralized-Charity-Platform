'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';
const ethers = require('ethers');

export default function RegisterNGOPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [showWalletWarning, setShowWalletWarning] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    contactEmail: '',
    description: '',
    website: '',
    documentHash: '',
    country: '',
    category: '',
  });

  // const { writeContract, data: hash, isPending } = useWriteContract();
  // const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    console.log("=== FRONTEND DEBUG INFO ===");
    console.log("Contract address:", CONTRACTS.NGORegistry.address);
    console.log("Contract ABI length:", CONTRACTS.NGORegistry.abi.length);
    console.log("Connected address:", address);
    console.log("Is connected:", isConnected);
  }, [address, isConnected]);

  const chainId = useChainId();
  
  // Add this check
  useEffect(() => {
    if (chainId !== 31337 && chainId !== 1337) { // Hardhat chain IDs
      console.warn('Wrong network detected. Please connect to Hardhat network.');
      // You can add a network switch prompt here
    }
  }, [chainId]);

  useEffect(() => {
    // Clear ALL wagmi and viem cache on mount
    if (typeof window !== 'undefined') {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('wagmi') || key?.includes('viem') || key?.includes('blockNumber')) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage too
      sessionStorage.clear();
      
      // Clear indexedDB
      indexedDB.databases?.().then(dbs => {
        dbs.forEach(db => {
          if (db.name?.includes('wagmi') || db.name?.includes('viem')) {
            indexedDB.deleteDatabase(db.name!);
          }
        });
      });
      
      console.log('🧹 Cleared all blockchain cache');
    }
  }, []);


  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess, 
    isError: receiptError,
    error: receiptErrorDetail 
  } = useWaitForTransactionReceipt({ 
    hash,
  });

  // Add useEffect to handle errors
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Submitted');
    
    if (!isConnected || !address) {
      alert('⚠️ Please connect your wallet first!');
      return;
    }
  
    try {
      console.log("Attempting registration with exact parameters...");
      
      // Use the EXACT same parameters that worked in the script
      const hash = await writeContract({
        address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        abi: CONTRACTS.NGORegistry.abi,
        functionName: 'registerNGO',
        args: [
          address, // ngoAddress
          formData.name,
          formData.registrationNumber, 
          formData.country,
          formData.category,
          formData.documentHash || 'QmDefault',
        ],
        // Add explicit gas to match Hardhat behavior
        gas: BigInt(500000),
      });
      
      console.log("✅ Transaction sent successfully:", hash);
      
    } catch (error: any) {
      console.error('❌ Frontend error:', error);
      
      // More detailed error analysis
      if (error?.cause?.data?.args) {
        console.log("Revert reason args:", error.cause.data.args);
      }
      if (error?.shortMessage) {
        console.log("Short message:", error.shortMessage);
      }
      
      alert('Transaction failed. Please check console for details.');
    }
  };

  // Handle successful transaction
  console.log("Transaction success status:", isSuccess);
  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && hash) {
      console.log("Transaction successful! Hash:", hash);
      
      // Prepare data for backend
      const backendData = {
        address: address,
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        country: formData.country,
        category: formData.category,
        description: formData.description,
        website: formData.website,
        email: formData.contactEmail, // Map contactEmail to email
        kycDocumentHash: formData.documentHash || 'QmDefault',
        transactionHash: hash,
        // ngoId will be generated by backend if not provided
      };

      console.log('Sending to backend:', backendData);
      
      // Save to backend database
      api.registerNGO(backendData)
      .then((response) => {
        console.log('Backend response:', response);
        alert('Registration submitted! You will be notified once verified.');
        router.push('/dashboard');
      })
      .catch(err => {
        console.error('Error saving to database:', err);
        alert('Registration recorded on blockchain, but failed to save to database. Please contact support.');
        router.push('/dashboard');
      });
    }
  }, [isSuccess, hash, formData, address, router]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Register as NGO</CardTitle>
          <p className="text-gray-600 mt-2">
            Complete the KYC process to start creating campaigns
          </p>
          
          {/* Wallet Connection Warning */}
          {!isConnected && (
            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Wallet Not Connected</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Please connect your wallet using the "Connect Wallet" button in the top right corner before registering.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connected Wallet Info */}
          {isConnected && address && (
            <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Wallet Connected</h3>
                  <p className="mt-1 text-sm text-green-700">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Save the Children Foundation"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number *
              </label>
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Official registration/tax ID number"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@organization.org"
              />
            </div>

            {/* Country - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., United States"
              />
            </div>

            {/* Category - REQUIRED */}
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
                <option value="">Select Category</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Disaster Relief">Disaster Relief</option>
                <option value="Environment">Environment</option>
                <option value="Poverty Alleviation">Poverty Alleviation</option>
                <option value="Human Rights">Human Rights</option>
              </select>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website (Optional)
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.organization.org"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your organization's mission and activities..."
              />
            </div>

            {/* Document Hash */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KYC Documents (IPFS Hash) *
              </label>
              <input
                type="text"
                required
                value={formData.documentHash}
                onChange={(e) => setFormData({ ...formData, documentHash: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="QmXxx... (IPFS hash)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload registration certificate, tax ID, and authorized signatory documents to IPFS
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
                {isPending ? 'Confirming in Wallet...' : isConfirming ? 'Submitting Registration...' : 'Submit Registration'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
