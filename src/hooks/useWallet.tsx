
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { walletRegistry } from '@/services/wallet/walletRegistry'; 
import { walletService, WalletType, WalletConnectionOptions } from '@/services/wallet/walletService';
import { shouldAttemptReconnect, setExplicitDisconnectFlag } from '@/utils/wallet';

interface UseWalletResult {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  walletType: WalletType | null;
  connectWallet: (type: WalletType, options?: WalletConnectionOptions) => Promise<{
    success: boolean;
    address?: string | null;
    error?: string;
  }>;
  disconnectWallet: () => Promise<boolean>;
  wallet: any; // Add a wallet property to hold the wallet provider
}

export function useWallet(): UseWalletResult {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [wallet, setWallet] = useState<any>(null);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // Only attempt reconnection if user didn't explicitly disconnect
        if (shouldAttemptReconnect()) {
          const storedWalletAddress = localStorage.getItem('walletAddress');
          const storedWalletType = localStorage.getItem('walletType') as WalletType | null;
          
          if (storedWalletAddress && storedWalletType) {
            console.log("Found stored wallet connection:", storedWalletAddress, storedWalletType);
            
            // Verify the connection is still valid
            const isConnected = await walletRegistry.verifyWalletConnection(storedWalletType);
            
            if (isConnected) {
              setWalletAddress(storedWalletAddress);
              setWalletType(storedWalletType);
              setIsConnected(true);
              console.log("Successfully verified existing wallet connection");
              
              // Set the wallet provider - use getProvider instead of getWalletProvider
              const provider = walletRegistry.getProvider(storedWalletType);
              if (provider) {
                setWallet(provider);
              }
            } else {
              console.log("Stored wallet connection is no longer valid");
              walletService.clearWalletConnection();
            }
          }
        } else {
          console.log("Auto-reconnect prevented: user explicitly disconnected");
        }
      } catch (error) {
        console.error("Error checking existing wallet connection:", error);
      }
    };

    checkExistingConnection();
  }, []);

  // Listen for wallet connection events from other components
  useEffect(() => {
    const handleWalletChanged = (event: CustomEvent) => {
      const detail = event.detail;
      
      if (detail.action === 'connected' && detail.wallet) {
        setWalletAddress(detail.wallet);
        setWalletType(detail.walletType || 'phantom');
        setIsConnected(true);
        
        // Clear explicit disconnect flag since user has connected
        setExplicitDisconnectFlag(false);
        
        // Set the wallet provider - use getProvider instead of getWalletProvider
        if (detail.walletType) {
          const provider = walletRegistry.getProvider(detail.walletType);
          if (provider) {
            setWallet(provider);
          }
        }
      } else if (detail.action === 'disconnected') {
        setWalletAddress(null);
        setWalletType(null);
        setIsConnected(false);
        setWallet(null);
      }
    };
    
    window.addEventListener('walletChanged', handleWalletChanged as EventListener);
    
    return () => {
      window.removeEventListener('walletChanged', handleWalletChanged as EventListener);
    };
  }, []);

  // Connect wallet function
  const connectWallet = useCallback(async (
    type: WalletType = 'phantom',
    options?: WalletConnectionOptions
  ) => {
    setIsConnecting(true);
    
    try {
      // Clear explicit disconnect flag since user is requesting connection
      setExplicitDisconnectFlag(false);
      
      console.log(`Connecting to ${type} wallet...`);
      const result = await walletRegistry.connectWallet(type, options);
      
      if (result.success && result.address) {
        setWalletAddress(result.address);
        setWalletType(type);
        setIsConnected(true);
        
        // Get and store the wallet provider - use getProvider instead of getWalletProvider
        const provider = walletRegistry.getProvider(type);
        if (provider) {
          setWallet(provider);
        }
        
        // Store connection in service and dispatch events
        await walletService.handleSuccessfulConnection(result.address, type);
        
        toast.success(`Connected to ${type} wallet`);
        console.log(`Successfully connected to ${type} wallet:`, result.address);
        
        return {
          success: true,
          address: result.address
        };
      } else {
        console.error(`Failed to connect to ${type} wallet:`, result.error);
        return {
          success: false,
          error: result.error || `Failed to connect to ${type} wallet`
        };
      }
    } catch (error: any) {
      console.error(`Error connecting to ${type} wallet:`, error);
      return {
        success: false,
        error: error.message || `Error connecting to ${type} wallet`
      };
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      console.log("Disconnecting wallet...");
      
      // Set explicit disconnect flag to prevent auto-reconnect
      setExplicitDisconnectFlag(true);
      
      await walletRegistry.disconnectWallet();
      walletService.clearWalletConnection();
      
      setWalletAddress(null);
      setWalletType(null);
      setIsConnected(false);
      setWallet(null);
      
      toast.success("Wallet disconnected");
      console.log("Wallet successfully disconnected");
      
      return true;
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      return false;
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    walletAddress,
    walletType,
    connectWallet,
    disconnectWallet,
    wallet
  };
}
