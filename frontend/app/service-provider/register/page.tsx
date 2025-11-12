'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';

export default function RegisterServiceProviderPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  const [formData, setFormData] = useState({
    name: '',
    serviceType: 'Healthcare',
    registrationNumber: '',
    location: '',
    contactInfo: '',
    documentHash: '',
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

  // Success handling
  useEffect(() => {
    if (isSuccess && hash) {
      if (!address) {
        console.error("Wallet address is undefined");
        alert("Wallet address is required to register as a service provider.");
        return;
      }
  
      console.log("Transaction successful! Hash:", hash);
  
      // Prepare data for backend
      const backendData = {
        address: address, // Ensure address is a string
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        serviceType: formData.serviceType,
        location: formData.location,
        contactInfo: formData.contactInfo,
        verificationDocHash: formData.documentHash || 'QmDefault',
        transactionHash: hash,
      };
  
      console.log('Sending to backend:', backendData);
  
      // Save to backend database
      api.registerServiceProvider(backendData)
        .then((response) => {
          console.log('Backend response:', response);
          alert('✅ Service Provider registration submitted!\\n\\nYou will be notified once verified.');
          router.push('/service-provider/dashboard');
        })
        .catch(err => {
          console.error('Error saving to database:', err);
          alert('Registration recorded on blockchain, but failed to save to database. Please contact support.');
          router.push('/service-provider/dashboard');
        });
    }
  }, [isSuccess, hash, formData, address, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isConnected || !address) {
      alert('⚠️ Please connect your wallet first!');
      return;
    }

    if (!formData.name || !formData.registrationNumber || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      writeContract({
        ...CONTRACTS.ServiceProviderRegistry,
        functionName: 'registerProvider',
        args: [
          address,
          formData.name,
          formData.registrationNumber,
          formData.serviceType,
          formData.location,
          formData.documentHash || 'QmDefault',
        ],
      });
    } catch (error: any) {
      console.error('Error registering service provider:', error);
      alert(error.message || 'Failed to register');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Please connect your wallet to register as a service provider
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Register as Service Provider</h1>
        <p className="mt-2 text-gray-600">
          Register to provide services and redeem beneficiary tokens
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
            <h3 className="text-sm font-medium text-blue-800">Service Provider Benefits</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Receive direct payments by providing services to beneficiaries</li>
                <li>No intermediaries - funds come directly from smart contract</li>
                <li>Build reputation through verified service delivery</li>
                <li>Automatic payment upon token redemption</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Information</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., City General Hospital"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Healthcare">Healthcare / Hospital</option>
                <option value="Education">Education / School</option>
                <option value="Housing">Housing / Shelter</option>
                <option value="Food">Food / Nutrition</option>
                <option value="Emergency">Emergency Services</option>
                <option value="Other">Other Services</option>
              </select>
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="Official registration/license number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State, Country"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information
              </label>
              <textarea
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                placeholder="Email, phone, website, etc."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Document Hash */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Documents (IPFS Hash) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.documentHash}
                onChange={(e) => setFormData({ ...formData, documentHash: e.target.value })}
                placeholder="QmXxx... (Upload documents to IPFS first)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload your license, registration documents to IPFS
              </p>
            </div>

            {/* Connected Wallet Info */}
            {address && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                <p className="text-sm text-green-700 mt-1">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isPending || isConfirming}
                className="flex-1"
              >
                {isPending && 'Waiting for approval...'}
                {isConfirming && 'Confirming transaction...'}
                {!isPending && !isConfirming && '🏥 Register as Service Provider'}
              </Button>
              
              <Button
                type="button"
                onClick={() => router.push('/')}
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