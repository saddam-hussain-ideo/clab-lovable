import { useState, useEffect, useCallback, useRef } from 'react';
import { walletRegistry } from '@/services/wallet/walletRegistry';
import { WalletConnectionOptions, WalletConnectionResult, WalletType } from '@/services/wallet/walletService';
import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';

export const useWallet = (onConnectChange?: (isConnected: boolean, address: string, type: WalletType) => void) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const isMounted = useRef(true);

  // Check local storage for existing connection on mount
  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    const storedType = localStorage.getItem('walletType') as WalletType | null;
    
    if (storedAddress && storedType) {
      setWalletAddress(storedAddress);
      setWalletType(storedType);
      setIsConnected(true);
      
      logDebug('WALLET_HOOK', `Found stored wallet: ${storedType} - ${storedAddress}`);
    }
  }, []);

  // Listen for global wallet events
  useEffect(() => {
    const handleWalletEvent = (event: Event) => {
      if (event instanceof CustomEvent) {
        const detail = event.detail;
        
        logDebug('WALLET_HOOK', `Received wallet event: ${JSON.stringify(detail)}`);
        
        if (detail.action === 'connected' && detail.wallet) {
          handleWalletConnected(detail.wallet, detail.walletType || detail.type);
        } else if (detail.action === 'disconnected') {
          setWalletAddress(null);
          setWalletType(null);
          setIsConnected(false);
        }
      }
    };
    
    window.addEventListener('walletChanged', handleWalletEvent);
    
    return () => {
      window.removeEventListener('walletChanged', handleWalletEvent);
    };
  }, []);

  const handleWalletConnected = useCallback(async (address: string, type: WalletType) => {
    if (!isMounted.current) return;
    
    logDebug('USE_WALLET', `Wallet connected: ${address} (${type})`);
    
    // Update local state
    setWalletAddress(address);
    setWalletType(type);
    setIsConnected(true);
    
    // Store connection in localStorage
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletType', type);
    localStorage.setItem('walletConnectedAt', Date.now().toString());
    
    // Dispatch global events
    window.dispatchEvent(new CustomEvent('walletChanged', {
      detail: {
        action: 'connected',
        wallet: address,
        walletType: type
      }
    }));
    
    window.dispatchEvent(new CustomEvent('walletSessionChanged', {
      detail: {
        walletAddress: address,
        walletType: type
      }
    }));
    
    // Notify parent components
    onConnectChange?.(true, address, type);
  }, [onConnectChange]);

  // Connect to wallet
  const connectWallet = async (walletId: WalletType, options: WalletConnectionOptions = {}): Promise<WalletConnectionResult> => {
    try {
      setIsConnecting(true);
      logDebug('WALLET_HOOK', `Connecting to wallet: ${walletId}`);
      
      const result = await walletRegistry.connectWallet(walletId, options);
      
      if (result.success && result.address) {
        handleWalletConnected(result.address, result.type || walletId);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      return {
        success: false,
        error: error.message || `Failed to connect to ${walletId}`,
        address: null,
        type: null
      };
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async (): Promise<WalletConnectionResult> => {
    try {
      logDebug('WALLET_HOOK', 'Disconnecting wallet');
      
      // Store the current wallet address before disconnecting
      const currentAddress = walletAddress;
      
      const success = await walletRegistry.disconnectWallet();
      
      if (success) {
        setWalletAddress(null);
        setWalletType(null);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Clear localStorage
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletType');
        localStorage.removeItem('walletConnectedAt');
        
        // Clear any wallet profile data
        if (currentAddress) {
          localStorage.removeItem(`wallet_profile_${currentAddress}`);
          
          // Clear any other wallet-related data
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('wallet_') || key.includes(currentAddress))) {
              keysToRemove.push(key);
            }
          }
          
          // Remove the keys in a separate loop to avoid issues with changing localStorage during iteration
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
          });
        }
        
        // Dispatch global event
        window.dispatchEvent(new CustomEvent('walletChanged', {
          detail: {
            action: 'disconnected',
            timestamp: Date.now()
          }
        }));
        
        logDebug('WALLET_HOOK', 'Successfully disconnected wallet');
        
        return {
          success: true,
          address: null,
          type: null
        };
      }
      
      return {
        success: false,
        error: 'Failed to disconnect wallet',
        address: walletAddress,
        type: walletType
      };
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      return {
        success: false,
        error: error.message || 'Failed to disconnect wallet',
        address: walletAddress,
        type: walletType
      };
    }
  };

  // Check for stored wallet in localStorage
  const checkStoredWallet = useCallback(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    const storedType = localStorage.getItem('walletType');
    
    if (storedAddress && storedType) {
      return {
        address: storedAddress,
        type: storedType
      };
    }
    
    return null;
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    isConnecting,
    isConnected,
    walletAddress,
    walletType,
    connectWallet,
    disconnectWallet,
    checkStoredWallet
  };
};
