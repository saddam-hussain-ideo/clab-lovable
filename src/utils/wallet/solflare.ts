
import { logDebug } from '@/utils/debugLogging';

/**
 * Utility for debugging Solflare wallet state
 */
export const debugSolflareState = () => {
  try {
    const log = (msg: string) => {
      console.log(msg);
      logDebug('SOLFLARE_DEBUG', msg);
    };

    if (typeof window === 'undefined' || !window.solflare) {
      log('Solflare not available in window object');
      return;
    }

    log(`Solflare state:`);
    log(`- isConnected: ${window.solflare.isConnected}`);
    log(`- publicKey: ${window.solflare.publicKey || 'null'}`);
    
    // Check if additional methods exist
    log(`- signTransaction method exists: ${!!window.solflare.signTransaction}`);
    log(`- signMessage method exists: ${!!window.solflare.signMessage}`);
    log(`- connect method exists: ${!!window.solflare.connect}`);
  } catch (error) {
    console.error('Error debugging Solflare state:', error);
  }
};

/**
 * Connect Solflare wallet using progressive retry approach
 * Removed browser notifications
 */
export const connectSolflareWallet = async (): Promise<string> => {
  try {
    if (!window.solflare) {
      throw new Error('Solflare wallet is not installed');
    }

    debugSolflareState();
    
    // If already connected, try to get the public key
    if (window.solflare.isConnected && window.solflare.publicKey) {
      const address = window.solflare.publicKey.toString();
      debugSolflareState();
      return address;
    }
    
    // Try to connect - removed parameter here as well
    await window.solflare.connect();
    
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    debugSolflareState();
    
    // Now try to get the public key with retries
    for (let i = 0; i < 6; i++) {
      if (window.solflare.isConnected && window.solflare.publicKey) {
        const address = window.solflare.publicKey.toString();
        debugSolflareState();
        return address;
      }
      
      // Wait with exponential backoff
      const delay = Math.min(1000 * Math.pow(1.5, i), 5000);
      logDebug('SOLFLARE', `No public key yet, attempt ${i+1}/6, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    debugSolflareState();
    
    if (!window.solflare.publicKey) {
      throw new Error('Failed to get public key from Solflare');
    }
    
    return window.solflare.publicKey.toString();
  } catch (error: any) {
    throw error;
  }
};

/**
 * Disconnect Solflare wallet with improved reliability
 */
export const disconnectSolflareWallet = async (): Promise<void> => {
  try {
    if (window.solflare && window.solflare.isConnected) {
      await window.solflare.disconnect();
      logDebug('SOLFLARE', 'Solflare wallet disconnected');
    }
  } catch (error) {
    console.error('Error disconnecting Solflare wallet:', error);
  }
};

/**
 * Robust connection method with multiple strategies
 */
export const robustSolflareConnect = async (): Promise<string | null> => {
  try {
    if (!window.solflare) {
      return null;
    }
    
    logDebug('SOLFLARE', 'Starting robust connection attempt');
    
    // If already connected with public key, return address
    if (window.solflare.isConnected && window.solflare.publicKey) {
      return window.solflare.publicKey.toString();
    }
    
    // First try disconnect to clear any bad state
    try {
      if (window.solflare.isConnected) {
        await window.solflare.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      // Continue even if disconnect fails
    }
    
    // Now try to connect - removed parameter
    await window.solflare.connect();
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to get public key with multiple attempts
    for (let i = 0; i < 8; i++) {
      if (window.solflare.isConnected && window.solflare.publicKey) {
        return window.solflare.publicKey.toString();
      }
      
      // Wait between attempts
      const delay = Math.min(800 * Math.pow(1.3, i), 4000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // If we still don't have a public key, return null
    return null;
  } catch (error) {
    logDebug('SOLFLARE', 'Error in robust connection:', error);
    return null;
  }
};
