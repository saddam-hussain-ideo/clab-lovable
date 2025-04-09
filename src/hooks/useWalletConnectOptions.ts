import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletType } from '@/services/wallet/walletService';
import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';
import { walletRegistry } from '@/services/wallet/walletRegistry';
import { getDetectedWallets } from '@/utils/wallet/walletDetection';
import { isMobileDevice } from '@/utils/device/deviceDetection';
import { useWalletMobileConnect } from './useWalletMobileConnect';
import { connectToPhantom, connectToMetaMask, connectToSolflare } from '@/utils/wallet/walletConnectionHelper';

export interface UseWalletConnectOptionsProps {
  onConnect?: (connected: boolean, address?: string | null, type?: WalletType | null) => void;
  onClose?: () => void;
  forcePrompt?: boolean;
}

export function useWalletConnectOptions({
  onConnect,
  onClose,
  forcePrompt = true
}: UseWalletConnectOptionsProps) {
  const {
    isConnecting: isConnectingEth,
    connectWallet: connectEthWallet,
    checkStoredWallet
  } = useWallet();
  
  const {
    isConnecting: isConnectingMobile,
    connectionResult,
    connectMobileWallet
  } = useWalletMobileConnect();
  
  const [isConnecting, setIsConnecting] = useState<WalletType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('solana');
  const [detectedWallets, setDetectedWallets] = useState<WalletType[]>([]);
  const isMobile = isMobileDevice();

  // Handle connection result from mobile connection - Ethereum only
  useEffect(() => {
    if (connectionResult && onConnect) {
      if (connectionResult.success && connectionResult.address) {
        // Connection successful
        onConnect(true, connectionResult.address, connectionResult.type);
      }
    }
  }, [connectionResult, onConnect]);

  // Detect available wallets on mount
  useEffect(() => {
    const detectAvailableWallets = async () => {
      const detected = getDetectedWallets();
      setDetectedWallets(detected);
      
      logDebug('WALLET_CONNECT_OPTIONS', `Detected wallets: ${detected.join(', ')}`);
    };
    
    detectAvailableWallets();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
  };

  const handleConnectWallet = async (walletType: WalletType) => {
    try {
      // If we're already connecting to this wallet, prevent duplicate attempts
      if (isConnecting === walletType) {
        console.log(`[useWalletConnectOptions] Already connecting to ${walletType}, ignoring request`);
        return;
      }
      
      // Set connecting state at the start
      setIsConnecting(walletType);
      setError(null);
      
      logDebug('WALLET_CONNECT_OPTIONS', `Connecting to wallet: ${walletType}`);
      
      let result;
      
      // Use our connection helpers
      switch (walletType) {
        case 'phantom':
          result = await connectToPhantom();
          break;
        case 'metamask':
          result = await connectToMetaMask();
          break;
        case 'solflare':
          result = await connectToSolflare();
          break;
        default:
          // Fallback to registry for other wallet types
          const provider = walletRegistry.getProvider(walletType);
          if (!provider) {
            throw new Error(`No provider found for wallet type: ${walletType}`);
          }

          // Check if the wallet is available
          if (!provider.isAvailable()) {
            // Open wallet installation page if not available
            if (walletType === 'metamask') {
              window.open('https://metamask.io/download/', '_blank');
            } else if (walletType === 'phantom') {
              window.open('https://phantom.app/', '_blank');
            }
            throw new Error(`${walletType} wallet not installed`);
          }

          // Connect using the provider
          const providerResult = await provider.connect({ forcePrompt });
          result = {
            success: providerResult.success,
            address: providerResult.address,
            error: providerResult.error
          };
          break;
      }
      
      if (!result.success || !result.address) {
        throw new Error(result.error || `Failed to connect to ${walletType}`);
      }
      
      // Call onConnect only on success
      if (onConnect) {
        onConnect(true, result.address, walletType);
      }
      
      // Reset connecting state on success
      setIsConnecting(null);
      setError(null);
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      // Set error state
      const errorMessage = error.message || `Failed to connect to ${walletType}`;
      setError(errorMessage);
      
      // Show error to user
      toast.error(errorMessage);
      
      // Call onConnect with failure
      if (onConnect) {
        onConnect(false, null, walletType);
      }
      
    } finally {
      // Always reset connecting state after a short delay
      setTimeout(() => {
        setIsConnecting(null);
      }, 500);
    }
  };

  // Special handler for Solflare connect
  const handleSolflareConnect = async (connected: boolean, address: string | null) => {
    try {
      logDebug('WALLET_CONNECT_OPTIONS', `Solflare connection result: ${connected}, ${address}`);
      
      if (connected && address) {
        // Store connection in localStorage
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletType', 'solflare');
        localStorage.setItem('walletConnectedAt', Date.now().toString());
        
        // Notify via callback
        if (onConnect) {
          onConnect(true, address, 'solflare');
        }
      } else if (!connected) {
        setError('Failed to connect to Solflare wallet');
      }
    } catch (error: any) {
      console.error('Error in Solflare connect handler:', error);
      setError(error.message || 'Error handling Solflare connection');
    }
  };

  return {
    activeTab,
    isConnecting,
    error,
    isConnectingEth,
    isConnectingMobile,
    detectedWallets,
    handleTabChange,
    handleConnectWallet,
    handleSolflareConnect,
    isMobileDevice: isMobile
  };
}
