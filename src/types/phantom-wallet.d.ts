
import { PhantomProvider, PhantomEthereumProvider } from '@/utils/wallet/types';

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
      ethereum?: PhantomEthereumProvider;
    };
  }
}

export type { PhantomProvider, PhantomEthereumProvider };
