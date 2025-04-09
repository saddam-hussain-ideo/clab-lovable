
import { useState, useEffect, useRef, useCallback } from 'react';
import { verifyWalletConnection, requestWalletRecheck } from '@/utils/wallet';
import { logDebug } from '@/utils/debugLogging';

interface WalletConnectionStatus {
  isConnected: boolean;
  isVerifying: boolean;
  walletAddress: string | null;
  walletType: string | null;
  lastVerified: number | null;
  verifyConnection: () => Promise<boolean>;
  requestRecheck: () => void;
}

/**
 * Hook to track wallet connection status globally
 * This acts as a centralized source for connection status across components
 */
export function useWalletConnectionStatus(): WalletConnectionStatus {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [lastVerified, setLastVerified] = useState<number | null>(null);
  const lastCheckRef = useRef<number>(0);
  const checkCountRef = useRef<number>(0);
  const isMounted = useRef(true);

  // Get initial state from localStorage
  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    const storedType = localStorage.getItem('walletType');
    
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
    
    if (storedType) {
      setWalletType(storedType);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to verify wallet connection
  const verifyConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Throttle checks to avoid excessive verification calls
      // Apply stronger throttling as check count increases
      const now = Date.now();
      const throttleTime = Math.min(5000 + (checkCountRef.current * 500), 20000);
      
      if (now - lastCheckRef.current < throttleTime) {
        return isConnected;
      }
      
      lastCheckRef.current = now;
      checkCountRef.current += 1;
      setIsVerifying(true);
      
      const storedAddress = localStorage.getItem('walletAddress');
      const storedType = localStorage.getItem('walletType');
      
      if (!storedAddress || !storedType) {
        if (isMounted.current) {
          setIsConnected(false);
          setWalletAddress(null);
          setWalletType(null);
          setIsVerifying(false);
          setLastVerified(now);
        }
        return false;
      }
      
      if (walletAddress !== storedAddress) {
        setWalletAddress(storedAddress);
      }
      
      if (walletType !== storedType) {
        setWalletType(storedType);
      }
      
      logDebug('WALLET_HOOK', 'Verifying wallet connection', {
        address: storedAddress,
        type: storedType
      });
      
      const connectionResult = await verifyWalletConnection();
      
      if (isMounted.current) {
        setIsConnected(connectionResult);
        setIsVerifying(false);
        setLastVerified(now);
        
        if (!connectionResult) {
          // If verification failed, update component state to match
          logDebug('WALLET_HOOK', 'Wallet verification failed, updating state', {
            previous: { connected: isConnected, address: walletAddress, type: walletType },
            verified: connectionResult
          });
          
          // Only clear states if verification explicitly failed
          // This way we don't nuke the state if the verification was just flaky
          // Let the AppRoutes component handle the actual storage clearing
        }
      }
      
      return connectionResult;
    } catch (error) {
      console.error('Error verifying wallet connection:', error);
      
      if (isMounted.current) {
        setIsVerifying(false);
        setIsConnected(false);
        setLastVerified(Date.now());
      }
      
      return false;
    }
  }, [isConnected, walletAddress, walletType]);

  // Listen for wallet connection verification events
  useEffect(() => {
    const handleWalletVerified = (event: CustomEvent) => {
      const { detail } = event;
      
      if (isMounted.current) {
        setLastVerified(Date.now());
        
        if (detail) {
          setIsConnected(!!detail.isConnected);
          
          // Update address and type if provided
          if (detail.address) {
            setWalletAddress(detail.address);
          }
          
          if (detail.walletType) {
            setWalletType(detail.walletType);
          }
          
          // If disconnected, clear address and type
          if (!detail.isConnected) {
            // Only clear internal state, not localStorage
            // This way we can use the stored values for reconnection
            setWalletAddress(null);
            setWalletType(null);
          }
        }
      }
    };
    
    // Handle manual verification requests
    const handleVerificationRequest = () => {
      verifyConnection();
    };
    
    // Handle wallet changed events
    const handleWalletChanged = (event: CustomEvent) => {
      const { detail } = event;
      
      if (detail?.action === 'connected' && detail.wallet) {
        if (isMounted.current) {
          setWalletAddress(detail.wallet);
          setWalletType(detail.walletType || detail.type);
          setIsConnected(true);
        }
      } else if (detail?.action === 'disconnected') {
        if (isMounted.current) {
          setWalletAddress(null);
          setWalletType(null);
          setIsConnected(false);
        }
      }
    };
    
    window.addEventListener('walletConnectionVerified', handleWalletVerified as EventListener);
    window.addEventListener('verifyWalletConnection', handleVerificationRequest as EventListener);
    window.addEventListener('walletChanged', handleWalletChanged as EventListener);
    
    // Initial verification
    verifyConnection();
    
    return () => {
      window.removeEventListener('walletConnectionVerified', handleWalletVerified as EventListener);
      window.removeEventListener('verifyWalletConnection', handleVerificationRequest as EventListener);
      window.removeEventListener('walletChanged', handleWalletChanged as EventListener);
    };
  }, [verifyConnection]);
  
  // Recheck on window focus - add debounce to prevent excessive checks
  useEffect(() => {
    let focusDebounceTimer: number | null = null;
    
    const handleFocus = () => {
      // Clear any existing timer
      if (focusDebounceTimer !== null) {
        window.clearTimeout(focusDebounceTimer);
      }
      
      // Set a new timer to delay the check
      focusDebounceTimer = window.setTimeout(() => {
        verifyConnection();
      }, 1500);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (focusDebounceTimer !== null) {
        window.clearTimeout(focusDebounceTimer);
      }
    };
  }, [verifyConnection]);

  // Helper function to request a recheck
  const requestRecheck = useCallback(() => {
    requestWalletRecheck();
  }, []);

  return {
    isConnected,
    isVerifying,
    walletAddress,
    walletType,
    lastVerified,
    verifyConnection,
    requestRecheck
  };
}
