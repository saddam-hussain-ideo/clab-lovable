
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';

/**
 * Check if Phantom Ethereum is available
 */
export const isPhantomEthereumAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.phantom !== undefined && 
         window.phantom.ethereum !== undefined;
};

/**
 * Check if Phantom Solana is available
 */
export const isPhantomSolanaAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.phantom !== undefined && 
         window.phantom.solana !== undefined;
};

/**
 * Connect to Phantom Ethereum wallet
 */
export const connectPhantomEthereumWallet = async (forcePrompt = false): Promise<string | null> => {
  try {
    if (!isPhantomEthereumAvailable()) {
      toast.error('Phantom wallet with Ethereum support is not installed');
      window.open('https://phantom.app/download', '_blank');
      return null;
    }
    
    const provider = window.phantom?.ethereum;
    if (!provider) {
      toast.error('Phantom Ethereum provider not found');
      return null;
    }
    
    logDebug('WALLET', `Connecting to Phantom Ethereum with forcePrompt=${forcePrompt}`);
    
    // Always force a new connection request when forcePrompt is true
    // This will ensure the wallet prompts for login
    if (forcePrompt) {
      try {
        // Force disconnect first to ensure a fresh connection prompt
        if (provider.disconnect) {
          await provider.disconnect();
        }
      } catch (e) {
        // Ignore disconnect errors
        console.log("Error during forced disconnect:", e);
      }
    }
    
    await provider.request({ method: 'eth_requestAccounts' });
    const accounts = await provider.request({ method: 'eth_accounts' });
    
    if (accounts && accounts.length > 0) {
      const address = accounts[0];
      
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletType', 'phantom_ethereum');
      localStorage.setItem('walletConnectedAt', Date.now().toString());
      
      window.dispatchEvent(new CustomEvent('walletChanged', {
        detail: {
          action: 'connected',
          wallet: address,
          walletType: 'phantom_ethereum',
        }
      }));
      
      return address;
    }
    
    toast.error('No accounts found in Phantom Ethereum wallet');
    return null;
  } catch (error: any) {
    console.error('Error connecting Phantom Ethereum wallet:', error);
    
    const errorMessage = error.code === 4001
      ? 'Connection rejected by user'
      : error.message || 'Failed to connect Phantom Ethereum wallet';
    
    toast.error(errorMessage);
    return null;
  }
};

/**
 * Connect to Phantom Solana wallet
 */
export const connectPhantomSolanaWallet = async (): Promise<string | null> => {
  try {
    if (!isPhantomSolanaAvailable()) {
      toast.error('Phantom wallet is not installed');
      window.open('https://phantom.app/download', '_blank');
      return null;
    }
    
    // Check if Solflare is defined, if so, try to disconnect first
    if (window.solflare && window.solflare.isConnected) {
      try {
        logDebug('WALLET', 'Disconnecting Solflare before connecting Phantom');
        await window.solflare.disconnect();
        // Add a small delay to ensure disconnect completes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error disconnecting Solflare:', e);
        // Continue anyway
      }
    }
    
    logDebug('WALLET', 'Connecting to Phantom Solana wallet');
    
    const { publicKey } = await window.phantom.solana.connect();
    const address = publicKey.toString();
    
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletType', 'phantom');
    localStorage.setItem('walletConnectedAt', Date.now().toString());
    
    window.dispatchEvent(new CustomEvent('walletChanged', {
      detail: {
        action: 'connected',
        wallet: address,
        walletType: 'phantom',
      }
    }));
    
    return address;
  } catch (error: any) {
    console.error('Error connecting Phantom Solana wallet:', error);
    
    const errorMessage = error.code === 4001
      ? 'Connection rejected by user'
      : error.message || 'Failed to connect Phantom Solana wallet';
    
    toast.error(errorMessage);
    return null;
  }
};

/**
 * Disconnect from Phantom Ethereum wallet
 */
export const disconnectPhantomEthereum = async (): Promise<boolean> => {
  try {
    // Phantom Ethereum doesn't have a disconnect method like Phantom Solana
    // We'll just clear the local storage
    
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletConnectedAt');
    
    window.dispatchEvent(new CustomEvent('walletChanged', {
      detail: {
        action: 'disconnected'
      }
    }));
    
    return true;
  } catch (error) {
    console.error('Error disconnecting Phantom Ethereum wallet:', error);
    return false;
  }
};

/**
 * Check if Phantom Ethereum is connected
 * This should not trigger a connection prompt
 */
export const isPhantomEthereumConnected = async (): Promise<boolean> => {
  try {
    logDebug('WALLET', 'Checking if Phantom Ethereum is connected (no prompt)');
    
    if (!isPhantomEthereumAvailable()) {
      return false;
    }
    
    const provider = window.phantom?.ethereum;
    if (!provider) {
      return false;
    }
    
    // IMPORTANT: Use eth_accounts (never use eth_requestAccounts for verification)
    // eth_accounts is read-only and won't prompt
    const accounts = await provider.request({ method: 'eth_accounts' });
    const isConnected = !!(accounts && accounts.length > 0);
    
    logDebug('WALLET', `Phantom Ethereum connection check result: ${isConnected}`);
    return isConnected;
  } catch (error) {
    console.error('Error checking Phantom Ethereum connection:', error);
    return false;
  }
};

/**
 * Verify Phantom Ethereum connection without prompting user
 */
export const verifyPhantomEthereumConnection = async (): Promise<string | null> => {
  try {
    logDebug('WALLET', 'Verifying Phantom Ethereum connection (no prompt)');
    
    if (!isPhantomEthereumAvailable()) {
      return null;
    }
    
    const provider = window.phantom?.ethereum;
    if (!provider) {
      return null;
    }
    
    // Only use eth_accounts here (read-only, never prompts)
    const accounts = await provider.request({ method: 'eth_accounts' });
    
    if (accounts && accounts.length > 0) {
      logDebug('WALLET', `Verified Phantom Ethereum account: ${accounts[0]}`);
      return accounts[0];
    }
    
    logDebug('WALLET', 'No Phantom Ethereum accounts found during verification');
    return null;
  } catch (error) {
    console.error('Error verifying Phantom Ethereum connection:', error);
    return null;
  }
};
