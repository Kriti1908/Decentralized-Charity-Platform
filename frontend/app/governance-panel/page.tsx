'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';

interface NGO {
  ngoId: number;
  address: string;
  name: string;
  status: string;
}

type GovernanceAction = 'verify' | 'challenge' | 'view-proposals';

interface GovernanceActionModalProps {
  ngo: NGO;
  action: GovernanceAction;
  onClose: () => void;
}

export default function GovernanceActionModal({ ngo, action, onClose }: GovernanceActionModalProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [description, setDescription] = useState('');
  const [evidenceHash, setEvidenceHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess, 
    isError: receiptError,
    error: receiptErrorDetail 
  } = useWaitForTransactionReceipt({ 
    hash,
  });

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      alert(`Transaction failed: ${writeError.message}`);
      setIsSubmitting(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      console.error('Transaction receipt error:', receiptErrorDetail);
      alert(`Transaction failed: ${receiptErrorDetail?.message || 'Unknown error'}`);
      setIsSubmitting(false);
    }
  }, [receiptError, receiptErrorDetail]);

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && hash) {
      console.log("Governance transaction successful! Hash:", hash);
      
      // Show success message
      if (action === 'verify') {
        alert('Verification proposal submitted successfully!');
      } else if (action === 'challenge') {
        alert('Challenge proposal submitted successfully!');
      }
      
      // Close modal and refresh page
      onClose();
      router.refresh(); // Refresh the page to show updated proposals
    }
  }, [isSuccess, hash, action, onClose, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting governance proposal...');
    
    if (!isConnected || !address) {
      alert('Please connect your wallet');
      return;
    }

    // Prevent an NGO from submitting a verification proposal for itself
    if (action === 'verify' && address.toLowerCase() === ngo.address.toLowerCase()) {
      alert('You cannot verify your own NGO. Verification must be performed by a verifier or through governance.');
      return;
    }

    // Validate required fields
    if (!description.trim()) {
      alert('Please provide a description for your proposal');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Calling governance contract with args:", {
        ngoId: ngo.ngoId,
        description,
        evidenceHash: evidenceHash || 'QmDefault',
      });

      if (action === 'verify') {
        // Create verification proposal
        writeContract({
          ...CONTRACTS.NGOGovernance,
          functionName: 'createVerificationProposal',
          args: [
            BigInt(ngo.ngoId), // ngoId
            description, // description
            evidenceHash || 'QmDefault', // evidenceHash
          ],
        });
      } else if (action === 'challenge') {
        // Create challenge proposal
        writeContract({
          ...CONTRACTS.NGOGovernance,
          functionName: 'challengeNGO',
          args: [
            BigInt(ngo.ngoId), // ngoId
            description, // description
            evidenceHash || 'QmDefault', // evidenceHash
          ],
        });
      }
      
      console.log("Governance contract call initiated");
    } catch (error: any) {
      console.error('Error submitting governance proposal:', error);
      alert(error.message || 'Failed to submit proposal');
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    switch (action) {
      case 'verify':
        return 'Propose NGO Verification';
      case 'challenge':
        return 'Challenge NGO Status';
      case 'view-proposals':
        return 'NGO Proposals';
      default:
        return 'Governance Action';
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case 'verify':
        return `Create a verification proposal for ${ngo.name}. Provide evidence and reasoning why this NGO should be verified.`;
      case 'challenge':
        return `Challenge the verified status of ${ngo.name}. Provide evidence and reasoning for your challenge.`;
      case 'view-proposals':
        return `View all governance proposals related to ${ngo.name}.`;
      default:
        return '';
    }
  };

  const getButtonText = () => {
    if (isPending) return 'Confirming in Wallet...';
    if (isConfirming) return 'Submitting Proposal...';
    if (isSubmitting) return 'Processing...';
    return 'Submit Proposal';
  };

  if (action === 'view-proposals') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>{getModalTitle()}</CardTitle>
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                disabled={isSubmitting}
              >
                ×
              </button>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{getActionDescription()}</p>
              <div className="text-center py-8">
                <p className="text-gray-500">Proposals list will be implemented here</p>
                {/* TODO: Implement proposals list */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Feature coming soon: View all verification and challenge proposals for this NGO.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  Close
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>{getModalTitle()}</CardTitle>
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{getActionDescription()}</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why you're proposing this action..."
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific about your reasons and provide clear justification
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidence Hash (IPFS)
                </label>
                <input
                  type="text"
                  value={evidenceHash}
                  onChange={(e) => setEvidenceHash(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Qm... (optional IPFS hash for evidence)"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add IPFS hash of supporting documents if available. Leave empty for no evidence.
                </p>
              </div>

              {/* Transaction Status */}
              {(isPending || isConfirming) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {isPending ? 'Please confirm the transaction in your wallet...' : 'Transaction confirmed! Waiting for execution...'}
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getButtonText()}
                </button>
              </div>

              {/* Help Text */}
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Submitting a proposal requires a transaction and will cost gas fees. 
                  Your proposal will be voted on by the community.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}