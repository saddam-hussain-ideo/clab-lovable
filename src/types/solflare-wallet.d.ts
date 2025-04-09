
import { SolflareProvider } from '@/types/wallet-providers';

// Reference the existing type rather than redefining it
declare global {
  interface Window {
    solflare?: SolflareProvider;
  }
}

export type { SolflareProvider };
