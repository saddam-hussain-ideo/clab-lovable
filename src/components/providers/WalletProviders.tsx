import React, { useEffect, useState } from 'react';
import { SolanaWalletProvider } from '@/providers/SolanaWalletProvider';
import { WalletProvider } from '@/providers/WalletProvider';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ReownProvider } from '@/providers/ReownProvider';

// Import the wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProvidersProps {
  children: React.ReactNode;
  network?: 'mainnet' | 'testnet' | 'devnet';
}

export function WalletProviders({ children, network = 'mainnet' }: WalletProvidersProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for the window object to be fully initialized
    if (typeof window !== 'undefined') {
      // Small delay to ensure all providers are ready
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!isReady) {
    return null; // Or a loading spinner
  }

  return (
    <ErrorBoundary>
      <WalletProvider>
        <ReownProvider>
          <SolanaWalletProvider network={network}>
            {children}
          </SolanaWalletProvider>
        </ReownProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}
