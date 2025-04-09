
import { useEffect, useRef } from 'react';
import { logDebug } from '@/utils/debugLogging';
import { useWalletConnectionStatus } from '@/hooks/useWalletConnectionStatus';

/**
 * Global wallet connection manager component
 * This should be mounted near the root of the app to provide global wallet connection management
 */
export function WalletConnectionManager() {
  const {
    isConnected,
    walletAddress,
    verifyConnection,
    lastVerified
  } = useWalletConnectionStatus();
  
  const isManaging = useRef(false);
  const checkCount = useRef(0);
  
  // Set up verification on focus and periodic checks
  useEffect(() => {
    const handleFocus = () => {
      if (!isManaging.current) {
        isManaging.current = true;
        
        // Verify wallet connection when window gains focus
        verifyConnection().finally(() => {
          isManaging.current = false;
        });
      }
    };
    
    // Calculate check interval - longer intervals as time goes on
    const getCheckInterval = () => {
      const baseInterval = 60000; // 1 minute
      const count = checkCount.current;
      
      // Scale the interval based on how many checks we've done
      if (count < 5) return baseInterval;
      if (count < 10) return baseInterval * 2; // 2 minutes
      if (count < 20) return baseInterval * 5; // 5 minutes 
      return baseInterval * 10; // 10 minutes max
    };
    
    // Verify connection periodically with dynamic interval
    const setupNextCheck = () => {
      const interval = getCheckInterval();
      
      return setTimeout(() => {
        if (!isManaging.current) {
          isManaging.current = true;
          checkCount.current += 1;
          
          verifyConnection().finally(() => {
            isManaging.current = false;
            // Setup the next check with potentially longer interval
            checkTimeoutRef.current = setupNextCheck();
          });
        }
      }, interval);
    };
    
    const checkTimeoutRef = { current: setupNextCheck() };
    
    window.addEventListener('focus', handleFocus);
    
    // Trigger an initial verification after a short delay
    setTimeout(() => {
      if (!isManaging.current) {
        isManaging.current = true;
        
        verifyConnection().finally(() => {
          isManaging.current = false;
        });
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(checkTimeoutRef.current);
    };
  }, [verifyConnection]);
  
  // Handle wallet connection events
  useEffect(() => {
    const handleWalletVerified = (event: CustomEvent) => {
      const { detail } = event;
      if (detail) {
        // We're no longer showing toast notifications here
        logDebug("WALLET_MANAGER", "Wallet verification event received", {
          isConnected: detail.isConnected,
          address: detail.address || walletAddress
        }, true);
      }
    };
    
    window.addEventListener('walletConnectionVerified', handleWalletVerified as EventListener);
    
    return () => {
      window.removeEventListener('walletConnectionVerified', handleWalletVerified as EventListener);
    };
  }, [walletAddress]);
  
  // Track connection status changes
  useEffect(() => {
    logDebug('WALLET_MANAGER', `Connection status changed to: ${isConnected ? 'connected' : 'disconnected'}`, {
      walletAddress,
      lastVerified
    }, true);
  }, [isConnected, walletAddress, lastVerified]);

  // This component doesn't render anything visible
  return null;
}
