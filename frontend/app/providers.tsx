 'use client';

import React, { useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, mainnet, localhost } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';

// Define localhost chain (Hardhat network)
const localhostChain = {
  ...localhost,
  id: 31337,
  name: 'Localhost 8545',
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
};

// Only include wallets that work (MetaMask and Coinbase)
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
      ],
    },
  ],
  {
    appName: 'CharityChain Platform',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  }
);

const config = getDefaultConfig({
  appName: 'CharityChain Platform',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [localhostChain, sepolia, mainnet],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // On client mount, attempt to programmatically add/switch the Localhost network in MetaMask
  // This reduces manual network switching clicks when users open the dApp.
  useEffect(() => {
    if (!('ethereum' in window)) return;

    const LOCAL_RPC = 'http://127.0.0.1:8545';
    const LOCAL_CHAIN_ID_HEX = '0x7a69'; // 31337

    (async function ensureLocalNetwork() {
      try {
        const current = await (window as any).ethereum.request({ method: 'eth_chainId' });
        if (current === LOCAL_CHAIN_ID_HEX) return;

        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: LOCAL_CHAIN_ID_HEX }],
          });
          console.log('Switched to Localhost 8545');
        } catch (switchError: any) {
          if (switchError && switchError.code === 4902) {
            try {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: LOCAL_CHAIN_ID_HEX,
                  chainName: 'Localhost 8545',
                  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                  rpcUrls: [LOCAL_RPC],
                  blockExplorerUrls: [],
                }],
              });
              // attempt to switch again after adding
              await (window as any).ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: LOCAL_CHAIN_ID_HEX }],
              });
              console.log('Added and switched to Localhost 8545');
            } catch (addErr) {
              console.warn('Failed to add Localhost network programmatically', addErr);
            }
          } else {
            console.warn('wallet_switchEthereumChain failed', switchError);
          }
        }
      } catch (err) {
        console.debug('ensureLocalNetwork: ethereum request failed', err);
      }
    })();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
