
import { Coin98Provider } from '@/utils/wallet/types';

declare global {
  interface Window {
    coin98?: {
      sol?: Coin98Provider;
    };
  }
}

export type { Coin98Provider };
