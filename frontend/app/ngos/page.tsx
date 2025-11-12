'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import GovernanceActionModal from '../governance-panel/page'; // You'll need to create this

// Types for NGO data
interface NGO {
  ngoId: number;
  address: string;
  name: string;
  registrationNumber: string;
  country: string;
  category: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  status: string; // 'pending' | 'verified' | 'rejected' | 'suspended' | 'blacklisted'
  reputationScore: number;
  totalCampaigns: number;
  totalFundsRaised: number;
  totalBeneficiaries: number;
  isActive: boolean;
  registeredAt: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type GovernanceAction = 'verify' | 'challenge' | 'view-proposals' | null;

export default function NGOsPage() {
  const { address, isConnected } = useAccount();
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [governanceAction, setGovernanceAction] = useState<GovernanceAction>(null);

  // Fetch all NGOs from backend
  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/ngos');
        
        if (!response.ok) {
          throw new Error('Failed to fetch NGOs');
        }
        
        const data = await response.json();
        setNgos(data.ngos || []);
      } catch (err) {
        console.error('Error fetching NGOs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load NGOs');
      } finally {
        setLoading(false);
      }
    };

    fetchNGOs();
  }, []);

  // Helper function to get status text and color
  const getNGOStatus = (status: string) => {
    const statusMap = {
      'pending': { text: 'Pending Verification', color: 'text-yellow-600' },
      'verified': { text: 'Verified', color: 'text-green-600' },
      'rejected': { text: 'Rejected', color: 'text-red-600' },
      'suspended': { text: 'Suspended', color: 'text-orange-600' },
      'blacklisted': { text: 'Blacklisted', color: 'text-red-800' },
    };
    return statusMap[status as keyof typeof statusMap] || { text: 'Unknown', color: 'text-gray-600' };
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle governance actions
  const handleGovernanceAction = (ngo: NGO, action: GovernanceAction) => {
    if (!isConnected) {
      alert('Please connect your wallet to perform governance actions');
      return;
    }
    
    setSelectedNGO(ngo);
    setGovernanceAction(action);
  };

  const closeModal = () => {
    setSelectedNGO(null);
    setGovernanceAction(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading NGOs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  // Filter and sort NGOs
  const verifiedNGOs = ngos.filter(ngo => ngo.status === 'verified');
  const pendingNGOs = ngos.filter(ngo => ngo.status === 'pending');
  const otherNGOs = ngos.filter(ngo => !['verified', 'pending'].includes(ngo.status));

  const sortedNGOs = [...verifiedNGOs, ...pendingNGOs, ...otherNGOs];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Registered NGOs</h1>
        <p className="text-gray-600 text-lg">
          Browse our network of charitable organizations
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Verified: {verifiedNGOs.length}
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            Pending: {pendingNGOs.length}
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Other: {otherNGOs.length}
          </span>
        </div>

        {isConnected && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Governance Enabled:</strong> You can participate in NGO verification and challenges with your connected wallet.
            </p>
          </div>
        )}
      </div>

      {sortedNGOs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNGOs.map((ngo) => {
            const statusInfo = getNGOStatus(ngo.status);
            return (
              <NGOCardWithGovernance 
                key={ngo.ngoId} 
                ngo={ngo} 
                onGovernanceAction={handleGovernanceAction}
                formatAddress={formatAddress}
                formatDate={formatDate}
                getNGOStatus={getNGOStatus}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No NGOs registered yet</p>
            <p className="text-sm text-gray-500 mt-2">
              NGOs will appear here once they complete the registration process.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Governance Action Modal */}
      {selectedNGO && governanceAction && (
        <GovernanceActionModal
          ngo={selectedNGO}
          action={governanceAction}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// Enhanced NGO Card Component with Governance Actions
interface NGOCardWithGovernanceProps {
  ngo: NGO;
  onGovernanceAction: (ngo: NGO, action: GovernanceAction) => void;
  formatAddress: (address: string) => string;
  formatDate: (dateString: string) => string;
  getNGOStatus: (status: string) => { text: string; color: string };
}

function NGOCardWithGovernance({ 
  ngo, 
  onGovernanceAction, 
  formatAddress, 
  formatDate, 
  getNGOStatus 
}: NGOCardWithGovernanceProps) {
  const { address, isConnected } = useAccount();
  const statusInfo = getNGOStatus(ngo.status);

  // Check if user can perform governance actions
  const canPerformActions = isConnected && address;

  return (
    <Card key={ngo.ngoId} hover className="relative">
      {/* Status indicator dot */}
      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
        ngo.status === 'verified' ? 'bg-green-500' :
        ngo.status === 'pending' ? 'bg-yellow-500' :
        ngo.status === 'rejected' ? 'bg-red-500' :
        ngo.status === 'suspended' ? 'bg-orange-500' : 'bg-gray-500'
      }`}></div>
      
      <CardHeader>
        <CardTitle className="text-lg">{ngo.name}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {formatAddress(ngo.address)}
        </p>
        {ngo.category && (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
            {ngo.category}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status</span>
            <span className={`font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Country</span>
            <span className="font-medium">{ngo.country || 'Not specified'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Reputation</span>
            <span className="font-medium">{ngo.reputationScore || 0}/1000</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Campaigns</span>
            <span className="font-medium">{ngo.totalCampaigns || 0}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Funds Raised</span>
            <span className="font-medium">
              {ngo.totalFundsRaised ? 
                `${(ngo.totalFundsRaised / 1e18).toFixed(2)} ETH` : 
                '0 ETH'
              }
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Registered</span>
            <span className="font-medium">
              {formatDate(ngo.registeredAt)}
            </span>
          </div>

          {ngo.status === 'verified' && ngo.verifiedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Verified</span>
              <span className="font-medium">
                {formatDate(ngo.verifiedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Governance Actions */}
        {canPerformActions && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              {ngo.status === 'pending' && (
                <button
                  onClick={() => onGovernanceAction(ngo, 'verify')}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Create a verification proposal for this NGO"
                  disabled={address?.toLowerCase() === ngo.address.toLowerCase()}
                >
                  {address?.toLowerCase() === ngo.address.toLowerCase() ? 'Cannot verify your own NGO' : 'Propose Verification'}
                </button>
              )}
              
              {ngo.status === 'verified' && (
                <button
                  onClick={() => onGovernanceAction(ngo, 'challenge')}
                  className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Challenge this NGO's verification status"
                >
                  Challenge NGO
                </button>
              )}
              
              {/* View Proposals feature is not implemented yet; hide to reduce confusion */}
            </div>
            
            {/* Helper text */}
            <p className="text-xs text-gray-500 mt-2 text-center">
              Governance actions require wallet connection
            </p>
          </div>
        )}

        {/* Not connected message */}
        {!isConnected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Connect wallet to participate in governance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}