import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletType } from '@/services/wallet/walletService';
import { logDebug } from '@/utils/debugLogging';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: WalletType | null;
  updateWalletState: (connected: boolean, address: string | null, type: WalletType | null) => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  walletAddress: null,
  walletType: null,
  updateWalletState: () => {},
});

export const useWalletContext = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);

  // Initialize wallet state from localStorage on mount
  useEffect(() => {
    // Small delay to ensure window and providers are ready
    const initTimer = setTimeout(() => {
      try {
        const storedAddress = localStorage.getItem('walletAddress');
        const storedType = localStorage.getItem('walletType') as WalletType | null;
        const connectedAt = localStorage.getItem('walletConnectedAt');
        
        if (storedAddress && storedType && connectedAt) {
          // Check if the connection is recent (within the last hour)
          const connectedTime = parseInt(connectedAt);
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          
          if (!isNaN(connectedTime) && connectedTime > oneHourAgo) {
            setWalletAddress(storedAddress);
            setWalletType(storedType);
            setIsConnected(true);
            
            const addressToLog = typeof storedAddress === 'string' 
              ? storedAddress.slice(0, 8) + '...'
              : 'non-string address';
            
            logDebug('WALLET_PROVIDER', `Initialized with stored wallet: ${storedType} - ${addressToLog}`);
          } else {
            // Clear stale wallet data
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('walletType');
            localStorage.removeItem('walletConnectedAt');
            
            logDebug('WALLET_PROVIDER', 'Cleared stale wallet data');
          }
        }
      } catch (error) {
        console.error('Error initializing wallet state:', error);
      }
    }, 50); // Small delay for initialization

    return () => clearTimeout(initTimer);
  }, []);

  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletChanged = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      if (detail?.action === 'connected' && detail?.wallet) {
        setIsConnected(true);
        setWalletAddress(detail.wallet);
        setWalletType(detail.walletType || detail.type);
        
        const addressToLog = typeof detail.wallet === 'string' 
          ? detail.wallet.slice(0, 8) + '...'
          : 'non-string address';
        
        logDebug('WALLET_PROVIDER', `Wallet connected via event: ${addressToLog}`);
      } else if (detail?.action === 'disconnected') {
        setIsConnected(false);
        setWalletAddress(null);
        setWalletType(null);
        
        logDebug('WALLET_PROVIDER', 'Wallet disconnected via event');
      }
    };
    
    const handleGlobalWalletConnected = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      if (detail?.address && detail?.connected) {
        setIsConnected(true);
        setWalletAddress(detail.address);
        setWalletType(detail.walletType);
        
        const addressToLog = typeof detail.address === 'string' 
          ? detail.address.slice(0, 8) + '...'
          : 'non-string address';
        
        logDebug('WALLET_PROVIDER', `Wallet connected via global event: ${addressToLog}`);
      }
    };
    
    window.addEventListener('walletChanged', handleWalletChanged);
    window.addEventListener('globalWalletConnected', handleGlobalWalletConnected);
    
    return () => {
      window.removeEventListener('walletChanged', handleWalletChanged);
      window.removeEventListener('globalWalletConnected', handleGlobalWalletConnected);
    };
  }, []);

  // Function to update wallet state (can be called from child components)
  const updateWalletState = (connected: boolean, address: string | null, type: WalletType | null) => {
    setIsConnected(connected);
    setWalletAddress(address);
    setWalletType(type);
    
    if (connected && address && type) {
      // Store in localStorage
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletType', type);
      localStorage.setItem('walletConnectedAt', Date.now().toString());
      
      const addressToLog = typeof address === 'string' 
        ? address.slice(0, 8) + '...'
        : 'non-string address';
      
      logDebug('WALLET_PROVIDER', `Wallet state updated: ${type} - ${addressToLog}`);
    } else {
      // Clear from localStorage
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      localStorage.removeItem('walletConnectedAt');
      
      logDebug('WALLET_PROVIDER', 'Wallet state cleared');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        walletType,
        updateWalletState,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
