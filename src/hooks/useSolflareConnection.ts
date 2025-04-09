
import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';
import { simpleSolflareConnect, simpleSolflareDisconnect } from '@/utils/wallet/simpleSolflareConnect';

interface UseSolflareConnectionResult {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
  publicKey: string | null;
}

export function useSolflareConnection(): UseSolflareConnectionResult {
  const { select, wallets, connect: adapterConnect, disconnect: adapterDisconnect, connected, publicKey } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [nativeConnected, setNativeConnected] = useState(false);
  const [nativePublicKey, setNativePublicKey] = useState<string | null>(null);
  
  // Check if connected via native wallet state
  const checkNativeConnection = useCallback(() => {
    if (window.solflare?.isConnected && window.solflare?.publicKey) {
      const address = window.solflare.publicKey.toString();
      setNativePublicKey(address);
      setNativeConnected(true);
      return true;
    }
    
    setNativeConnected(false);
    return false;
  }, []);
  
  // Check connection on mount and when window gets focus
  useEffect(() => {
    checkNativeConnection();
    
    const handleFocus = () => {
      checkNativeConnection();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkNativeConnection]);
  
  // The connect function that will use our custom utility
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      // Return true immediately if already connected
      if ((connected && publicKey) || nativeConnected) {
        logDebug('SOLFLARE_HOOK', 'Already connected to Solflare');
        return true;
      }
      
      setIsConnecting(true);
      logDebug('SOLFLARE_HOOK', 'Connecting to Solflare');
      
      // Show info toast with ID so we can dismiss it later
      toast.info('Connecting to Solflare wallet...', {
        id: 'solflare-connecting',
        duration: 10000
      });
      
      // First try with our simplified direct connection
      const simpleResult = await simpleSolflareConnect();
      
      if (simpleResult.success && simpleResult.address) {
        // Update our internal state
        setNativePublicKey(simpleResult.address);
        setNativeConnected(true);
        
        // Dismiss connecting toast and show success
        toast.dismiss('solflare-connecting');
        toast.success('Connected to Solflare wallet');
        
        logDebug('SOLFLARE_HOOK', 'Successfully connected via simplified method');
        return true;
      }
      
      // If direct method failed, try with the adapter
      logDebug('SOLFLARE_HOOK', 'Direct connection failed, trying adapter');
      
      // Find Solflare wallet adapter
      const solflareWallet = wallets.find(wallet => 
        wallet.adapter.name.toLowerCase() === 'solflare'
      );
      
      if (!solflareWallet) {
        toast.dismiss('solflare-connecting');
        toast.error('Solflare wallet not found');
        return false;
      }
      
      // Select and connect using adapter
      select(solflareWallet.adapter.name);
      await adapterConnect();
      
      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if we're connected
      const adapterSuccess = !!publicKey && connected;
      const nativeSuccess = checkNativeConnection();
      
      if (adapterSuccess || nativeSuccess) {
        toast.dismiss('solflare-connecting');
        toast.success('Connected to Solflare wallet');
        logDebug('SOLFLARE_HOOK', 'Successfully connected via adapter');
        return true;
      }
      
      // If all methods failed
      toast.dismiss('solflare-connecting');
      toast.error(simpleResult.error || 'Failed to connect to Solflare');
      
      return false;
    } catch (error: any) {
      logDebug('SOLFLARE_HOOK', 'Error connecting to Solflare:', error);
      
      toast.dismiss('solflare-connecting');
      toast.error(error?.message || 'Failed to connect to Solflare');
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [connected, publicKey, nativeConnected, select, wallets, adapterConnect, checkNativeConnection]);
  
  // Disconnect function that uses both methods
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      logDebug('SOLFLARE_HOOK', 'Disconnecting from Solflare');
      
      // First try direct disconnect
      await simpleSolflareDisconnect();
      
      // Then disconnect via adapter
      await adapterDisconnect();
      
      // Update our internal state
      setNativeConnected(false);
      setNativePublicKey(null);
      
      toast.success('Disconnected from Solflare wallet');
    } catch (error) {
      console.error('Error disconnecting from Solflare:', error);
      toast.error('Error disconnecting from Solflare');
    }
  }, [adapterDisconnect]);
  
  // Determine the final public key to return
  const finalPublicKey = publicKey ? publicKey.toString() : nativePublicKey;
  
  // Determine if we're connected using either method
  const isConnected = connected || nativeConnected;
  
  return {
    connect,
    disconnect,
    isConnecting,
    isConnected,
    publicKey: finalPublicKey
  };
}
