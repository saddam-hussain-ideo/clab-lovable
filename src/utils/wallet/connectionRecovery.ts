
/**
 * Utility for recovering wallet connections across sessions and page reloads
 */
import { logDebug } from '@/utils/debugLogging';
import { WalletType } from '@/services/wallet/walletService';

// Connection states that can be recovered
export interface StoredConnectionState {
  address: string;
  type: WalletType;
  connectedAt: number;
  expiresAt: number;
  sessionId?: string;
}

/**
 * Store wallet connection state for potential recovery
 */
export const storeConnectionState = (
  address: string,
  type: WalletType,
  expiresInMinutes: number = 1440 // Default to 24 hours (1440 minutes)
): StoredConnectionState => {
  const now = Date.now();
  const expiresAt = now + (expiresInMinutes * 60 * 1000);
  const sessionId = `session-${now}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Create connection state
  const connectionState: StoredConnectionState = {
    address,
    type,
    connectedAt: now,
    expiresAt,
    sessionId
  };
  
  // Store in localStorage
  localStorage.setItem('walletConnectionState', JSON.stringify(connectionState));
  
  // Also store individual values for compatibility with existing code
  localStorage.setItem('walletAddress', address);
  localStorage.setItem('walletType', type);
  localStorage.setItem('walletConnectedAt', now.toString());
  
  logDebug('WALLET_RECOVERY', `Stored connection state for ${type} wallet: ${address}`);
  
  return connectionState;
};

/**
 * Get stored connection state
 */
export const getStoredConnectionState = (): StoredConnectionState | null => {
  try {
    const storedState = localStorage.getItem('walletConnectionState');
    
    if (!storedState) {
      // Try to construct from individual values for backward compatibility
      const address = localStorage.getItem('walletAddress');
      const type = localStorage.getItem('walletType') as WalletType | null;
      const connectedAtStr = localStorage.getItem('walletConnectedAt');
      
      if (address && type && connectedAtStr) {
        const connectedAt = parseInt(connectedAtStr, 10);
        const now = Date.now();
        
        // Default expiration is 24 hours from connection time
        const expiresAt = connectedAt + (24 * 60 * 60 * 1000);
        
        return {
          address,
          type,
          connectedAt,
          expiresAt
        };
      }
      
      return null;
    }
    
    return JSON.parse(storedState) as StoredConnectionState;
  } catch (error) {
    console.error('Error retrieving stored connection state:', error);
    return null;
  }
};

/**
 * Check if stored connection is valid and not expired
 */
export const isStoredConnectionValid = (): boolean => {
  const connectionState = getStoredConnectionState();
  
  if (!connectionState) return false;
  
  const now = Date.now();
  
  // Check if connection has expired
  if (connectionState.expiresAt < now) {
    logDebug('WALLET_RECOVERY', 'Stored connection has expired');
    clearStoredConnection();
    return false;
  }
  
  return true;
};

/**
 * Clear stored connection state
 */
export const clearStoredConnection = (): void => {
  localStorage.removeItem('walletConnectionState');
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('walletType');
  localStorage.removeItem('walletConnectedAt');
  
  logDebug('WALLET_RECOVERY', 'Cleared stored connection state');
};

/**
 * Listen for connection recovery opportunities
 * This is useful for mobile connections that might redirect back to the app
 */
export const setupConnectionRecoveryListener = (
  callback: (address: string, type: WalletType) => void
): () => void => {
  const handleConnectionRecovery = () => {
    try {
      // Check URL parameters for connection recovery
      if (typeof window === 'undefined') return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const wallet = urlParams.get('wallet');
      const status = urlParams.get('status');
      const address = urlParams.get('address');
      
      // If we have valid connection parameters
      if (wallet && status === 'success' && address) {
        logDebug('WALLET_RECOVERY', `Found connection recovery parameters: ${wallet}, ${address}`);
        
        // Store the connection state
        storeConnectionState(address, wallet as WalletType);
        
        // Call the callback
        callback(address, wallet as WalletType);
        
        // Clean up URL
        const newUrl = window.location.pathname + 
          (window.location.search ? window.location.search.replace(/[?&]wallet=[^&]*(&|$)|[?&]status=[^&]*(&|$)|[?&]address=[^&]*(&|$)/g, '$1') : '') + 
          window.location.hash;
        
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (error) {
      console.error('Error in connection recovery listener:', error);
    }
  };
  
  // Check immediately on setup
  handleConnectionRecovery();
  
  // Also check when the page becomes visible again
  document.addEventListener('visibilitychange', handleConnectionRecovery);
  window.addEventListener('focus', handleConnectionRecovery);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleConnectionRecovery);
    window.removeEventListener('focus', handleConnectionRecovery);
  };
};
