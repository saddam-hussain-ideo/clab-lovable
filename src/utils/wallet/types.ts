
// TypeScript declarations for wallet types
import { 
  PhantomSolanaProvider, 
  SolflareProvider, 
  EthereumProvider,
  isPhantomEthereumAvailable as checkPhantomEthereum
} from "@/types/wallet-providers";

// Re-export the isPhantomEthereumAvailable function
export const isPhantomEthereumAvailable = (): boolean => {
  return checkPhantomEthereum();
};

// Re-export the types for backward compatibility
export type PhantomProvider = PhantomSolanaProvider;
export type PhantomEthereumProvider = EthereumProvider;

// Define global interfaces - but use the ones from wallet-providers.ts instead of redefining
declare global {
  interface Window {
    // These are already defined in wallet-providers.ts
    gtag?: (...args: any[]) => void;
    // Remove the Buffer declaration from here since it's already defined elsewhere
  }
}

export {};
