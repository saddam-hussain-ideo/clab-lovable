import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { isMetamaskInstalled, connectMetamask, disconnectMetamask } from '@/utils/wallet/metamask';
import { walletService } from '@/lib/services/walletService';
import { withRetry } from '@/utils/retry/retryUtils';
import { walletRegistry } from '@/services/wallet/walletRegistry';
import { AppKit } from '@reown/sdk';

export interface WalletConnectionResult {
  success: boolean;
  address?: string | null;
  type?: string | null;
  network?: 'solana' | 'ethereum' | null;
  error?: string;
}

export const useWalletConnection = (options = { autoConnect: false }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [network, setNetwork] = useState<'solana' | 'ethereum' | null>(null);
  
  const checkStoredWallet = useCallback(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    const storedType = localStorage.getItem('walletType');
    const storedNetwork = localStorage.getItem('walletNetwork');
    const connectedAt = localStorage.getItem('walletConnectedAt');
    
    if (storedAddress && storedType && connectedAt) {
      const connectedTime = parseInt(connectedAt, 10);
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (now - connectedTime < dayInMs) {
        setWalletAddress(storedAddress);
        setWalletType(storedType);
        setNetwork(storedNetwork as 'solana' | 'ethereum' | null);
        setIsConnected(true);
        return { address: storedAddress, type: storedType, network: storedNetwork };
      } else {
        walletService.clearWalletConnection();
      }
    }
    
    return null;
  }, []);

  const connectPhantomWallet = useCallback(async (namespace: 'solana' | 'eip155'): Promise<WalletConnectionResult> => {
    try {
      const appKit = AppKit.getInstance();
      const result = await appKit.open({
        view: "Connect",
        namespace,
        filters: {
          wallets: ["phantom"]
        },
        features: {
          socials: false
        }
      });

      if (!result?.address) {
        throw new Error('No address returned from Phantom');
      }

      const walletType = namespace === 'solana' ? 'phantom_solana' : 'phantom_ethereum';
      await walletService.handleSuccessfulConnection(result.address, walletType);
      
      setWalletAddress(result.address);
      setWalletType(walletType);
      setNetwork(namespace === 'solana' ? 'solana' : 'ethereum');
      setIsConnected(true);

      return {
        success: true,
        address: result.address,
        type: walletType,
        network: namespace === 'solana' ? 'solana' : 'ethereum'
      };

    } catch (error: any) {
      console.error(`Error connecting Phantom ${namespace} wallet:`, error);
      toast.error(error.message || `Failed to connect Phantom ${namespace} wallet`);
      return {
        success: false,
        error: error?.message || `Failed to connect Phantom ${namespace} wallet`
      };
    }
  }, []);
  
  const connectWallet = useCallback(async (walletName: string): Promise<WalletConnectionResult> => {
    try {
      setIsConnecting(true);
      
      switch (walletName.toLowerCase()) {
        case 'phantom_solana':
          return await connectPhantomWallet('solana');
          
        case 'phantom_ethereum':
          return await connectPhantomWallet('eip155');
          
        case 'metamask':
          if (!isMetamaskInstalled()) {
            toast.error('MetaMask is not installed');
            window.open('https://metamask.io/download/', '_blank');
            return { success: false, error: 'MetaMask is not installed' };
          }
          
          const address = await withRetry(
            () => connectMetamask(),
            {
              maxRetries: 3,
              context: 'Metamask Connection',
              shouldRetry: (error) => {
                const errorMsg = error?.message || '';
                return errorMsg.includes('timeout') || 
                       errorMsg.includes('network') ||
                       errorMsg.includes('rate limit');
              }
            }
          );
          
          if (address) {
            await walletService.handleSuccessfulConnection(address, 'metamask');
            setWalletAddress(address);
            setWalletType('metamask');
            setNetwork('ethereum');
            setIsConnected(true);
            return { success: true, address, type: 'metamask', network: 'ethereum' };
          }
          return { success: false, error: 'Failed to connect MetaMask' };
          
        case 'solflare':
          if (!window.solflare) {
            toast.error('Solflare is not installed');
            window.open('https://solflare.com/download', '_blank');
            return { success: false, error: 'Solflare is not installed' };
          }
          
          try {
            const resp = await window.solflare.connect();
            if (resp && window.solflare.publicKey) {
              const solflareAddress = window.solflare.publicKey.toString();
              await walletService.handleSuccessfulConnection(solflareAddress, 'solflare');
              setWalletAddress(solflareAddress);
              setWalletType('solflare');
              setNetwork('solana');
              setIsConnected(true);
              return { success: true, address: solflareAddress, type: 'solflare', network: 'solana' };
            }
          } catch (error: any) {
            console.error('Error connecting Solflare:', error);
            toast.error(error.message || 'Failed to connect Solflare');
            return { success: false, error: error?.message || 'Failed to connect Solflare' };
          }
          
        default:
          toast.error(`Wallet type "${walletName}" not supported`);
          return { success: false, error: `Wallet type "${walletName}" not supported` };
      }
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return { success: false, error: error?.message || 'Failed to connect wallet' };
    } finally {
      setIsConnecting(false);
    }
  }, [connectPhantomWallet]);
  
  const disconnectWallet = useCallback(async (): Promise<WalletConnectionResult> => {
    try {
      const currentWalletType = localStorage.getItem('walletType');
      const currentNetwork = localStorage.getItem('walletNetwork');
      
      if (currentWalletType?.startsWith('phantom')) {
        const appKit = AppKit.getInstance();
        await appKit.disconnect();
      } else if (currentWalletType === 'metamask') {
        await disconnectMetamask();
      } else if (currentWalletType === 'solflare' && window.solflare) {
        await window.solflare.disconnect();
      }
      
      walletService.clearWalletConnection();
      setWalletAddress(null);
      setWalletType(null);
      setNetwork(null);
      setIsConnected(false);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      toast.error(error.message || 'Failed to disconnect wallet');
      return { success: false, error: error?.message || 'Failed to disconnect wallet' };
    }
  }, []);

  const withRetryBackoff = useCallback((fn: () => Promise<any>, options = {}) => {
    return withRetry(fn, {
      maxRetries: 3,
      ...options
    });
  }, []);
  
  const restoreWalletProfile = useCallback(async (walletAddress: string, walletType: string = 'phantom'): Promise<boolean> => {
    try {
      console.log("Attempting to restore wallet profile for:", walletAddress, walletType);
      
      if (!localStorage.getItem('walletAddress')) {
        toast.error("Wallet is not connected. Please connect your wallet first.");
        return false;
      }
      
      const profile = await walletService.fetchWalletProfile(walletAddress, walletType);
      
      if (!profile) {
        console.log("No profile found to restore for wallet:", walletAddress);
        return false;
      }
      
      console.log("Found wallet profile to restore:", profile);
      
      const syncedProfile = await walletService.syncWalletProfile(
        walletAddress, 
        profile, 
        true,
        walletType
      );
      
      if (syncedProfile) {
        console.log("Successfully restored wallet profile:", syncedProfile);
        return true;
      } else {
        console.error("Failed to sync wallet profile during restoration");
        return false;
      }
    } catch (error) {
      console.error("Error restoring wallet profile:", error);
      return false;
    }
  }, []);

  return {
    isConnecting,
    isConnected,
    walletAddress,
    walletType,
    network,
    connectWallet,
    disconnectWallet,
    checkStoredWallet,
    withRetryBackoff,
    setIsConnecting,
    restoreWalletProfile
  };
};
