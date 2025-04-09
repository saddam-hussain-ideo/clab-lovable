
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';
import { useWalletConnectionUtils } from './wallet/useWalletConnectionUtils';
import { useMetaMaskWallet } from './wallet/useMetaMaskWallet';
import { usePhantomWallet } from './wallet/usePhantomWallet';
import { usePhantomEthereumWallet } from './wallet/usePhantomEthereumWallet';
import { useSolflareWallet } from './wallet/useSolflareWallet';
import { WalletConnectionResult, WalletConnectionHookResult } from '@/types/wallet-connection';

/**
 * Main wallet connection hook that coordinates between different wallet types
 */
export const useWalletConnection = (options = { autoConnect: false }): WalletConnectionHookResult => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  
  // Import wallet-specific hooks
  const { 
    checkStoredWallet: checkStoredWalletUtil, 
    clearExistingConnections, 
    withRetryBackoff,
    restoreWalletProfile
  } = useWalletConnectionUtils();
  
  const { connectMetaMaskWallet, disconnectMetaMaskWallet } = useMetaMaskWallet();
  const { connectPhantomWallet, disconnectPhantomWallet } = usePhantomWallet();
  const { connectPhantomEthWallet, disconnectPhantomEthWallet } = usePhantomEthereumWallet();
  const { connectSolflare, disconnectSolflare } = useSolflareWallet();
  
  // Check wallet connection status on component mount
  useEffect(() => {
    if (options.autoConnect) {
      checkStoredWallet();
    }
    
    // Add event listener for wallet connection events from external components
    const handleWalletConnectionEvent = (event: CustomEvent) => {
      const { detail } = event;
      if (detail?.connected && detail?.address) {
        setWalletAddress(detail.address);
        setWalletType(detail.walletType || detail.type || 'unknown');
        setIsConnected(true);
      }
    };
    
    window.addEventListener('globalWalletConnected', handleWalletConnectionEvent as EventListener);
    window.addEventListener('walletChanged', handleWalletConnectionEvent as EventListener);
    
    return () => {
      window.removeEventListener('globalWalletConnected', handleWalletConnectionEvent as EventListener);
      window.removeEventListener('walletChanged', handleWalletConnectionEvent as EventListener);
    };
  }, [options.autoConnect]);
  
  // Check for stored wallet connection
  const checkStoredWallet = useCallback(() => {
    const storedWallet = checkStoredWalletUtil();
    
    if (storedWallet) {
      setWalletAddress(storedWallet.address);
      setWalletType(storedWallet.type);
      setIsConnected(true);
      return storedWallet;
    }
    
    return null;
  }, [checkStoredWalletUtil]);
  
  // Connect to the specified wallet type
  const connectWallet = useCallback(async (walletName: string): Promise<WalletConnectionResult> => {
    try {
      setIsConnecting(true);
      
      await clearExistingConnections();
      
      logDebug('WALLET', `Attempting to connect ${walletName} wallet`);
      
      let result: WalletConnectionResult;
      
      switch (walletName.toLowerCase()) {
        case 'metamask':
          result = await connectMetaMaskWallet();
          break;
          
        case 'phantom_ethereum':
          result = await connectPhantomEthWallet();
          break;
          
        case 'phantom':
          result = await connectPhantomWallet();
          break;
          
        case 'solflare':
          // Improved Solflare connection with multiple attempts
          result = await connectSolflare();
          
          // Additional verification for Solflare
          if (result.success && !result.address && window.solflare?.publicKey) {
            // Try to recover address from window.solflare if not provided in result
            const recoveredAddress = window.solflare.publicKey.toString();
            result.address = recoveredAddress;
            logDebug('WALLET', `Recovered Solflare address: ${recoveredAddress}`);
          }
          break;
          
        default:
          toast.error(`Wallet type "${walletName}" not supported`);
          return { success: false, error: `Wallet type "${walletName}" not supported` };
      }
      
      if (result.success && result.address) {
        setWalletAddress(result.address);
        setWalletType(result.type || walletName);
        setIsConnected(true);
        
        // Dispatch global wallet event for components listening to wallet changes
        window.dispatchEvent(new CustomEvent('walletChanged', { 
          detail: { 
            action: 'connected', 
            wallet: result.address,
            walletType: result.type || walletName,
            time: new Date().toISOString() 
          }
        }));
      }
      
      return result;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return { success: false, error: error?.message || 'Failed to connect wallet' };
    } finally {
      setIsConnecting(false);
    }
  }, [
    clearExistingConnections, 
    connectMetaMaskWallet, 
    connectPhantomEthWallet, 
    connectPhantomWallet, 
    connectSolflare
  ]);
  
  // Disconnect the current wallet
  const disconnectWallet = useCallback(async (): Promise<WalletConnectionResult> => {
    try {
      const currentWalletAddress = localStorage.getItem('walletAddress');
      const currentWalletType = localStorage.getItem('walletType');
      
      logDebug('WALLET', `Disconnecting current wallet type: ${currentWalletType}`);
      
      let result: WalletConnectionResult = { success: true };
      
      switch (currentWalletType) {
        case 'metamask':
          result = await disconnectMetaMaskWallet();
          break;
          
        case 'phantom':
          result = await disconnectPhantomWallet();
          break;
          
        case 'phantom_ethereum':
          result = await disconnectPhantomEthWallet();
          break;
          
        case 'solflare':
          result = await disconnectSolflare();
          break;
      }
      
      // Clear connection data from localStorage
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      localStorage.removeItem('walletConnectedAt');
      
      // Update state
      setWalletAddress(null);
      setWalletType(null);
      setIsConnected(false);
      
      // Dispatch wallet disconnected event with previous wallet information
      window.dispatchEvent(new CustomEvent('walletChanged', { 
        detail: { 
          action: 'disconnected', 
          previousWallet: currentWalletAddress,
          previousWalletType: currentWalletType,
          time: new Date().toISOString() 
        }
      }));
      
      return result;
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      toast.error(error.message || 'Failed to disconnect wallet');
      return { success: false, error: error?.message || 'Failed to disconnect wallet' };
    }
  }, [
    disconnectMetaMaskWallet,
    disconnectPhantomWallet,
    disconnectPhantomEthWallet,
    disconnectSolflare
  ]);
  
  return {
    isConnecting,
    isConnected,
    walletAddress,
    walletType,
    connectWallet,
    disconnectWallet,
    checkStoredWallet,
    clearExistingConnections,
    withRetryBackoff,
    restoreWalletProfile
  };
};

export type { WalletConnectionResult };
