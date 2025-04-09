import { useCallback, useEffect, useState } from 'react';
import { AppKit, AppKitOptions } from '@reown/sdk';
import { useAppKitState, useAppKitNetwork, useAppKitTheme } from '@reown/appkit/react';
import { WalletType } from '@/services/wallet/walletService';
import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';
import type { CaipNetwork } from '@reown/appkit/core';

// Define network configurations
const ethereumMainnet: CaipNetwork = {
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
};

const solanaMainnet: CaipNetwork = {
  id: 'solana:mainnet',
  chainNamespace: 'solana',
  caipNetworkId: 'solana:mainnet',
  name: 'Solana',
  rpcUrls: {
    default: { http: ['https://api.mainnet-beta.solana.com'] },
    public: { http: ['https://api.mainnet-beta.solana.com'] }
  },
  nativeCurrency: {
    name: 'SOL',
    symbol: 'SOL',
    decimals: 9
  }
};

export function useReownWallet() {
  const [isConnecting, setIsConnecting] = useState<WalletType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { open } = useAppKitState();
  const { caipNetwork, caipNetworkId, chainId, switchNetwork } = useAppKitNetwork();
  const { setThemeMode, setThemeVariables } = useAppKitTheme();

  useEffect(() => {
    // Set theme on mount
    setThemeMode('dark');
    setThemeVariables({
      '--w3m-color-mix': '#00BB7F',
      '--w3m-color-mix-strength': 40,
    });
  }, [setThemeMode, setThemeVariables]);

  const connectWallet = useCallback(async (type: WalletType) => {
    try {
      setIsConnecting(type);
      setError(null);

      const options: AppKitOptions = {
        view: 'Connect',
        filters: {
          wallets: [mapWalletTypeToReownWallet(type)]
        },
        features: {
          socials: false,
          modal: true
        }
      };

      // For Phantom wallet, handle network selection
      if (type === 'phantom' || type === 'phantom_ethereum') {
        // Switch to Ethereum by default
        await switchNetwork(ethereumMainnet);
        await open(options);

        // After modal opens, check if user wants to switch to Solana
        if (caipNetworkId?.includes('solana')) {
          await switchNetwork(solanaMainnet);
        }
      } else {
        // For non-Phantom wallets, specify the namespace
        options.namespace = type.includes('ethereum') ? 'eip155' : 'solana';
        await open(options);
      }

      const kit = AppKit.getInstance();
      const address = await kit.getAddress();
      
      toast.success(`Connected to ${type}`);
      return { address };
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err?.message || 'Failed to connect wallet');
      toast.error(err?.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(null);
    }
  }, [open, switchNetwork, caipNetworkId]);

  const disconnectWallet = async () => {
    try {
      const kit = AppKit.getInstance();
      await kit.disconnect();
      logDebug('WALLET', 'Disconnected wallet');
      toast.success('Wallet disconnected');
    } catch (err: any) {
      console.error('Error disconnecting wallet:', err);
      toast.error(err?.message || 'Failed to disconnect wallet');
    }
  };

  const mapWalletTypeToReownWallet = (type: WalletType): string => {
    switch (type) {
      case 'phantom':
      case 'phantom_ethereum':
        return 'phantom';
      case 'metamask':
        return 'metamask';
      case 'solflare':
        return 'solflare';
      default:
        return 'walletconnect';
    }
  };

  return {
    connectWallet,
    disconnectWallet,
    isConnecting,
    error,
    selectedNetwork: caipNetwork,
    chainId,
    switchNetwork
  };
}
