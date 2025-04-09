
// Import all wallet-related types
import { EthereumProvider, PhantomSolanaProvider, SolflareProvider, Coin98Provider, CoinbaseWalletProvider } from './wallet-providers';
import { StacksProvider } from './stacks-wallet';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    global: typeof globalThis;
    __safePropsPatchApplied: boolean;
    
    // Add the missing ethereumPrice property
    ethereumPrice?: number;
    
    // Add triggerCryptoPriceRefresh function
    triggerCryptoPriceRefresh?: () => void;
    
    // All wallet providers are now defined in wallet-providers.ts
    // No need to redeclare them here
    
    // Add Coinbase Wallet
    coinbaseWallet?: CoinbaseWalletProvider;
    ethereum?: EthereumProvider;
    phantom?: {
      ethereum?: EthereumProvider;
      solana?: PhantomSolanaProvider;
    };
    solflare?: SolflareProvider;
    
    // For debugging
    testCoinGeckoAPIKey?: (apiKey?: string) => Promise<{success: boolean; message: string}>;
    testEthereumRpc?: (rpcUrl: string) => Promise<{
      success: boolean;
      blockNumber?: string;
      latency: number;
      error?: string;
    }>;
  }
}
