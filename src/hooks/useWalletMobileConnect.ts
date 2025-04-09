import { useState, useEffect } from 'react';
import { WalletType, WalletConnectionResult } from '@/services/wallet/walletService';
import { logDebug } from '@/utils/debugLogging';
import { walletRegistry } from '@/services/wallet/walletRegistry';

export interface MobileConnectionResult {
  success: boolean;
  address?: string | null;
  type?: WalletType | null;
  error?: string;
}

export function useWalletMobileConnect() {
  const [isConnecting, setIsConnecting] = useState<WalletType | null>(null);
  const [connectionResult, setConnectionResult] = useState<WalletConnectionResult | null>(null);

  const connectMobileWallet = async (walletType: WalletType): Promise<WalletConnectionResult> => {
    try {
      setIsConnecting(walletType);
      setConnectionResult(null);

      const provider = walletRegistry.getProvider(walletType);
      if (!provider) {
        throw new Error(`No provider found for wallet type: ${walletType}`);
      }

      // Use the provider's connect method with mobile-specific options
      const result = await provider.connect({ 
        forcePrompt: true,
        isMobile: true 
      });

      setConnectionResult(result);
      return result;
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message || 'Failed to connect wallet',
        address: null,
        type: null
      };
      setConnectionResult(errorResult);
      return errorResult;
    } finally {
      setIsConnecting(null);
    }
  };

  return {
    isConnecting,
    connectionResult,
    connectMobileWallet
  };
}
