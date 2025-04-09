import React, { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { mainnet, sepolia } from 'viem/chains';
import type { Chain } from 'viem';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import type { CaipNetwork } from '@reown/appkit/core';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const projectId = '6c52f34647d6b0874e74b1523f918842';

const metadata = {
  name: 'CLAB',
  description: 'CLAB Web Application',
  url: 'https://clab.vercel.app',
  icons: ['https://clab.vercel.app/favicon.ico']
};

// Define network configurations
const ethereumNetworks: CaipNetwork[] = [
  {
    id: 'eip155:1',
    chainNamespace: 'eip155',
    caipNetworkId: 'eip155:1',
    name: 'Ethereum',
    rpcUrls: {
      default: { http: ['https://eth.llamarpc.com'] },
      public: { http: ['https://eth.llamarpc.com'] }
    },
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
];

const solanaNetworks: CaipNetwork[] = [
  {
    id: 'solana:mainnet',
    chainNamespace: 'solana',
    caipNetworkId: 'solana:mainnet',
    name: 'Solana',
    rpcUrls: {
      default: { http: [clusterApiUrl('mainnet-beta')] },
      public: { http: [clusterApiUrl('mainnet-beta')] }
    },
    nativeCurrency: {
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9
    }
  }
];

// Combine all networks
const allNetworks: CaipNetwork[] = [...ethereumNetworks, ...solanaNetworks];

// Create Wagmi Adapter for Ethereum
const wagmiAdapter = new WagmiAdapter({
  networks: ethereumNetworks,
  projectId,
  ssr: false
});

// Create Solana Adapter with mainnet and devnet
const solanaAdapter = new SolanaAdapter({
  mainnet: new Connection(clusterApiUrl('mainnet-beta')),
  devnet: new Connection(clusterApiUrl('devnet')) // Required by type
});

interface ReownProviderProps {
  children: ReactNode;
}

export function ReownProvider({ children }: ReownProviderProps) {
  useEffect(() => {
    // Create AppKit with multichain support
    createAppKit({
      adapters: [wagmiAdapter, solanaAdapter],
      networks: allNetworks,
      projectId,
      metadata,
      features: {
        analytics: true,
        socials: false,
        email: false,
        emailShowWallets: true,
        modal: true
      }
    });
  }, []); // Only run once on mount

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
