"use client";

import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';

interface NGOItem {
  ngoId: number;
  address: string;
  name: string;
  registrationNumber: string;
  country?: string;
  category?: string;
  status: string;
}

export default function AdminPanelPage() {
  const { address, isConnected } = useAccount();
  const [ngos, setNgos] = useState<NGOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifierRole, setVerifierRole] = useState<string | null>(null);

  const [hasVerifierRole, setHasVerifierRole] = useState<boolean>(false);
  const [hasAdminRole, setHasAdminRole] = useState<boolean>(false);
  const [verifiedCountState, setVerifiedCountState] = useState<number | null>(null);
  const [adminFrozen, setAdminFrozen] = useState<boolean>(false);
  const [freezeThreshold, setFreezeThreshold] = useState<number>(3);

  // Read VERIFIER_ROLE and check on-chain hasRole using a JSON-RPC provider
  useEffect(() => {
    const checkRole = async () => {
      try {
        // dynamic import to avoid server-side bundling issues
        // @ts-ignore
        const ethersModule = await import('ethers');
        // @ts-ignore
        const { ethers } = ethersModule;
        const rpc = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
        
        // ethers v6 syntax: use JsonRpcProvider (not ethers.providers.JsonRpcProvider)
        // @ts-ignore
        const provider = new ethers.JsonRpcProvider(rpc);
        const contract = new ethers.Contract(CONTRACTS.NGORegistry.address, CONTRACTS.NGORegistry.abi, provider);
        
        console.log('[Admin Panel] Checking roles for address:', address);
        
        const vRole = await contract.VERIFIER_ROLE();
        console.log('[Admin Panel] VERIFIER_ROLE:', vRole);
        setVerifierRole(vRole as string);
        
        const adminRole = await contract.ADMIN_ROLE();
        console.log('[Admin Panel] ADMIN_ROLE:', adminRole);
        
        if (address) {
          const hasV = await contract.hasRole(vRole, address);
          console.log('[Admin Panel] hasVerifierRole:', hasV);
          setHasVerifierRole(Boolean(hasV));
          
          const hasA = await contract.hasRole(adminRole, address);
          console.log('[Admin Panel] hasAdminRole:', hasA);
          setHasAdminRole(Boolean(hasA));
        }

        // fetch verified count and frozen state
        try {
          const vCount = await contract.verifiedCount();
          console.log('[Admin Panel] verifiedCount:', vCount.toString());
          setVerifiedCountState(Number(vCount.toString()));
        } catch (e) {
          console.warn('Could not read verifiedCount:', e);
        }

        try {
          const frozen = await contract.adminVerificationFrozen();
          console.log('[Admin Panel] adminVerificationFrozen:', frozen);
          setAdminFrozen(Boolean(frozen));
        } catch (e) {
          console.warn('Could not read adminVerificationFrozen:', e);
        }
      } catch (err) {
        console.error('[Admin Panel] Unable to read verifier role on-chain:', err);
      }
    };

    checkRole();
  }, [address]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use absolute URL to avoid Next.js routing issues
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/ngos`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`API error (${res.status}): ${errorText}`);
        }
        
        const data = await res.json();
        console.log('Fetched NGOs:', data);
        
        const pending = (data.ngos || []).filter((n: NGOItem) => n.status === 'pending');
        setNgos(pending);
      } catch (err: any) {
        console.error('Failed to fetch NGOs:', err);
        const errorMsg = err.message || 'Failed to load NGOs';
        setError(`⚠️ ${errorMsg}\n\nMake sure the backend is running at http://localhost:5000`);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  // use wagmi write hook to send verifyNGO transactions
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      (async () => {
        const res = await fetch('/api/ngos');
        const data = await res.json();
        const pending = (data.ngos || []).filter((n: NGOItem) => n.status === 'pending');
        setNgos(pending);
      })();
    }
  }, [isSuccess]);

  const handleVerify = async (ngoId: number) => {
    if (!hasVerifierRole) {
      alert('Your connected account is not a verifier. You cannot perform admin verifications on-chain.');
      return;
    }

    try {
      writeContract({
        ...CONTRACTS.NGORegistry,
        functionName: 'verifyNGO',
        args: [BigInt(ngoId)],
      });
      alert('Transaction submitted. Confirm in your wallet.');
    } catch (err: any) {
      console.error('Verify error', err);
      alert(err?.message || 'Verification failed');
    }
  };

  const handleFreeze = async () => {
    if (!hasAdminRole) {
      alert('Your connected account is not an admin. Cannot freeze admin verification.');
      return;
    }

    try {
      writeContract({
        ...CONTRACTS.NGORegistry,
        functionName: 'freezeAdminVerification',
        args: [],
      });
      alert('Freeze transaction submitted. Confirm in your wallet.');
    } catch (err: any) {
      console.error('Freeze error', err);
      alert(err?.message || 'Freeze failed');
    }
  };

  const handleCheckAndFreeze = async () => {
    if (!hasAdminRole) {
      alert('Admin role required to perform freeze');
      return;
    }
    if (verifiedCountState === null) {
      alert('Verified count unknown');
      return;
    }
    if (verifiedCountState >= freezeThreshold) {
      // call freeze
      handleFreeze();
    } else {
      alert(`Verified NGOs (${verifiedCountState}) < threshold (${freezeThreshold}). Not freezing.`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Panel — NGO Verification</h1>
        <p className="text-gray-600 mt-2">Only addresses with the on-chain VERIFIER_ROLE can verify NGOs using this panel.</p>
        <div className="mt-3 p-3 bg-yellow-50 rounded">
          <p className="text-sm text-yellow-800">
            Note: This admin panel is a convenience for local / small deployments. When the network governance is fully on-chain and decentralized, this admin UI will be frozen and verification decisions will be made by the blockchain governance mechanism only.
          </p>
        </div>
        <div className="mt-4 p-4 bg-white border rounded flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-700">Verified NGOs: <span className="font-medium">{verifiedCountState ?? '–'}</span></p>
            <p className="text-xs text-gray-500">Admin verification frozen: <span className="font-medium">{adminFrozen ? 'Yes' : 'No'}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={freezeThreshold}
              onChange={(e) => setFreezeThreshold(Number(e.target.value))}
              className="w-24 border px-2 py-1 rounded"
              min={1}
            />
            <button onClick={handleCheckAndFreeze} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">Auto-freeze if ≥ threshold</button>
            {hasAdminRole ? (
              <button onClick={handleFreeze} className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700">Freeze now</button>
            ) : (
              <button disabled className="bg-gray-200 text-gray-500 px-3 py-2 rounded">Admin required</button>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending NGO Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-gray-600">Loading pending NGOs...</p>}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 font-medium">⚠️ Failed to Fetch NGOs</p>
              <p className="text-sm text-red-600 mt-1 whitespace-pre-line">{error}</p>
              <p className="text-xs text-red-500 mt-2">
                Troubleshooting:
                <br />• Make sure backend is running: <code className="bg-red-100 px-1">npm run dev</code> in /backend
                <br />• Check backend logs for errors
                <br />• Verify MongoDB is connected
              </p>
            </div>
          )}
          
          {!loading && !error && ngos.length === 0 && <p className="text-gray-600">No pending NGOs found.</p>}

          <div className="grid gap-4 mt-4">
            {ngos.map((ngo) => (
              <div key={ngo.ngoId} className="p-4 border rounded bg-white flex justify-between items-center">
                <div>
                  <div className="font-medium">{ngo.name} <span className="text-xs text-gray-500">#{ngo.ngoId}</span></div>
                  <div className="text-sm text-gray-600">{ngo.address}</div>
                  <div className="text-xs text-gray-500 mt-1">{ngo.registrationNumber} • {ngo.country || 'N/A'}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected && hasVerifierRole ? (
                    <button
                      onClick={() => handleVerify(ngo.ngoId)}
                      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                    >
                      Verify on-chain
                    </button>
                  ) : (
                    <button disabled className="bg-gray-200 text-gray-500 px-3 py-2 rounded">Verifier role required</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
