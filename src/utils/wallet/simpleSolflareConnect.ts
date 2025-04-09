
/**
 * Simple Solflare connection utilities that don't trigger connection prompts
 */
import { logDebug } from '@/utils/debugLogging';

interface SolflareCheckResult {
  connected: boolean;
  hasPublicKey: boolean;
  address: string | null;
}

/**
 * Check Solflare connection state without triggering any popups
 */
export const checkSolflareState = (): SolflareCheckResult => {
  try {
    if (!window.solflare) {
      return { connected: false, hasPublicKey: false, address: null };
    }

    const connected = !!window.solflare.isConnected;
    const hasPublicKey = !!window.solflare.publicKey;
    const address = hasPublicKey ? window.solflare.publicKey.toString() : null;

    return { connected, hasPublicKey, address };
  } catch (err) {
    console.error('Error checking Solflare state:', err);
    return { connected: false, hasPublicKey: false, address: null };
  }
};

interface SimpleSolflareResult {
  success: boolean;
  address: string | null;
  error?: string;
}

/**
 * Attempt to connect to Solflare without forcing UI interaction
 * Only returns a connection if already authorized
 */
export const simpleSolflareConnect = async (): Promise<SimpleSolflareResult> => {
  try {
    logDebug('SOLFLARE', 'Starting simple connection check');
    
    // Check if Solflare is available
    if (!window.solflare) {
      return { success: false, address: null, error: 'Solflare not installed' };
    }
    
    // If already connected with a public key, return the address
    if (window.solflare.isConnected && window.solflare.publicKey) {
      const address = window.solflare.publicKey.toString();
      logDebug('SOLFLARE', `Already connected with address: ${address}`);
      return { success: true, address };
    }
    
    // We're not trying to connect here - that would trigger UI
    // This function only checks existing connection state
    
    // If we reach here, wallet is not connected or doesn't have public key
    return { success: false, address: null, error: 'Not connected' };
  } catch (err) {
    console.error('Error in simple Solflare connect:', err);
    return { 
      success: false, 
      address: null, 
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};
