import React, { useMemo, useEffect, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import the wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaWalletProviderProps {
  children: React.ReactNode;
  network?: 'mainnet' | 'testnet' | 'devnet';
}

export function SolanaWalletProvider({ children, network = 'mainnet' }: SolanaWalletProviderProps) {
  const [isReady, setIsReady] = useState(false);

  // Map network string to WalletAdapterNetwork
  const walletNetwork = useMemo(() => {
    switch (network) {
      case 'mainnet':
        return WalletAdapterNetwork.Mainnet;
      case 'testnet':
        return WalletAdapterNetwork.Testnet;
      case 'devnet':
      default:
        return WalletAdapterNetwork.Mainnet;
    }
  }, [network]);

  // The network endpoint
  const endpoint = useMemo(() => clusterApiUrl(walletNetwork), [walletNetwork]);

  // Initialize wallet adapters with error handling
  const wallets = useMemo(() => {
    if (!isReady) return [];
    
    try {
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter()
      ];
    } catch (error) {
      console.error('Error initializing wallet adapters:', error);
      return [];
    }
  }, [isReady]);

  // Handle initialization timing and fetch interception
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReady(false);
      return;
    }

    // Intercept fetch to handle URL cloning errors
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = args[0]?.toString() || '';
      
      // Return empty results for problematic wallet listing requests
      if (url.includes('getRecommendedWallets') || url.includes('preloadListings')) {
        console.log('[SolanaWalletProvider] Intercepting wallet listing request:', url);
        return new Response(JSON.stringify({ data: [] }));
      }
      
      return originalFetch.apply(this, args);
    };

    const timer = setTimeout(() => {
      try {
        // Check if window.solana exists
        if (window.solana) {
          // Wait for any existing property definitions to complete
          Promise.resolve().then(() => {
            setIsReady(true);
          });
        } else {
          console.warn('Solana provider not found in window object');
          setIsReady(true); // Still set ready to allow fallback behavior
        }
      } catch (error) {
        console.error('Error during Solana initialization:', error);
        setIsReady(true); // Set ready even on error to prevent hanging
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      window.fetch = originalFetch;
    };
  }, []);

  // Don't render until we're ready
  if (!isReady) {
    return null;
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={(error) => {
          console.error('Wallet error:', error);
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
