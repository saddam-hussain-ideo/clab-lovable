
import { useState, useEffect } from 'react';
import { getActiveNetwork } from '@/utils/wallet/index';
import { supabase } from '@/lib/supabase';
import { useWallet } from './useWallet';

export interface Token {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  balance: number;
  priceUsd: number;
  change24h: number;
  mintAddress: string; // Add this field to match what TokenSelector expects
}

// Define the TokenInfo interface that TokenSelector expects
export interface TokenInfo {
  mintAddress: string;
  amount: number;
  decimals: number;
  balance: number;
  metadata?: {
    name?: string;
    symbol?: string;
    address?: string;
    logoURI?: string;
  };
}

/**
 * Hook to fetch wallet tokens
 */
export const useWalletTokens = (walletAddress?: string | null, refreshTrigger?: number) => {
  const { walletAddress: connectedWalletAddress } = useWallet();
  const address = walletAddress || connectedWalletAddress;
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fix the function to not expect parameters
  const activeNetwork = getActiveNetwork();

  const fetchTokens = async (forceRefresh?: boolean) => {
    if (!address) {
      setTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For development, use mocked data
      const mockTokens: Token[] = [
        {
          id: '1',
          name: 'Solana',
          symbol: 'SOL',
          logo: '/lovable-uploads/94e50721-6d36-44b1-8a30-350fe371ebf7.png',
          balance: 3.55,
          priceUsd: 125.73,
          change24h: 2.34,
          mintAddress: 'So11111111111111111111111111111111111111112'
        },
        {
          id: '2',
          name: 'USD Coin',
          symbol: 'USDC',
          logo: '/lovable-uploads/c704a74e-49c1-492d-8f47-9691eb17f88a.png',
          balance: 254.12,
          priceUsd: 1.00,
          change24h: 0.01,
          mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        },
        {
          id: '3',
          name: 'CLAB Token',
          symbol: 'CLAB',
          logo: '/lovable-uploads/988144ca-38fb-4273-a0cf-e82e64218efc.png',
          balance: 5000,
          priceUsd: 0.032,
          change24h: 8.75,
          mintAddress: 'CLABXnz7YrNtG5sMPh3WsvLQpzSGHGJrhHqzA8xvbUcZ'
        }
      ];

      // If we're on testnet, adjust some details
      if (activeNetwork === 'testnet') {
        mockTokens.push({
          id: '4',
          name: 'Test Token',
          symbol: 'TEST',
          logo: '/lovable-uploads/6816aa98-3b42-467c-ad07-a8079f5e4199.png',
          balance: 10000,
          priceUsd: 0.001,
          change24h: 15.5,
          mintAddress: 'TESTzvmdsixpYdvpYZqmNRo1hRmWNWJ1Qo5QKFdKia'
        });
      }

      setTokens(mockTokens);

      // In a real application, we would fetch actual token data
      // const { data, error } = await supabase
      //   .from('wallet_tokens')
      //   .select('*')
      //   .eq('wallet_address', address);
      //
      // if (error) throw error;
      // setTokens(data || []);
    } catch (err: any) {
      console.error('Error fetching tokens:', err);
      setError(err.message || 'Failed to fetch tokens');
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [address, activeNetwork, refreshTrigger]);

  // Add refetch method to the returned object
  const refetch = async (forceRefresh?: boolean) => {
    return await fetchTokens(forceRefresh);
  };

  return { 
    tokens, 
    isLoading, 
    error,
    refetch
  };
};

// Helper function to convert from Token to TokenInfo
export const tokenToTokenInfo = (token: Token): TokenInfo => {
  return {
    mintAddress: token.mintAddress,
    amount: token.balance * 1000000000, // Convert to lamports or smallest unit
    decimals: 9, // Default for most Solana tokens
    balance: token.balance,
    metadata: {
      name: token.name,
      symbol: token.symbol,
      address: token.mintAddress,
      logoURI: token.logo
    }
  };
};
