/**
 * Wallet Connection Helper
 * 
 * A utility to help with reliable wallet connections by handling common issues:
 * - Provider initialization timing
 * - Cross-provider conflicts
 * - Connection state management
 * - Error handling and recovery
 */

import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';
import { WalletType } from '@/services/wallet/walletService';

// Maximum number of connection attempts
const MAX_CONNECTION_ATTEMPTS = 3;

// Delay between connection attempts (ms)
const CONNECTION_RETRY_DELAY = 1500;

/**
 * Safely connect to a wallet with retries and proper error handling
 */
export async function connectWalletSafely(
  walletType: WalletType,
  connectFn: () => Promise<any>
): Promise<{ success: boolean; address: string | null; error?: string }> {
  let attempts = 0;
  let lastError: Error | null = null;

  // Clear any stale wallet connection data
  clearStaleWalletData();

  logDebug('WALLET_CONNECTION', `Attempting to connect to ${walletType}...`);

  while (attempts < MAX_CONNECTION_ATTEMPTS) {
    attempts++;
    
    try {
      logDebug('WALLET_CONNECTION', `Connection attempt ${attempts} for ${walletType}`);
      
      // Ensure the page is fully loaded
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          window.addEventListener('load', resolve, { once: true });
          // Fallback if event doesn't fire
          setTimeout(resolve, 1000);
        });
      }

      // Ensure provider is available with a delay
      if (!(await ensureProviderAvailable(walletType))) {
        throw new Error(`${walletType} provider not available`);
      }
      
      // Call the specific wallet connection function
      const result = await connectFn();
      
      if (!result || !result.address) {
        throw new Error(`${walletType} connection failed to return an address`);
      }
      
      // Save wallet data to localStorage
      localStorage.setItem('walletAddress', result.address);
      localStorage.setItem('walletType', walletType);
      localStorage.setItem('walletConnectedAt', Date.now().toString());
      
      logDebug('WALLET_CONNECTION', `Successfully connected to ${walletType}: ${result.address.slice(0, 8)}...`);
      
      // Dispatch wallet events
      dispatchWalletEvents(result.address, walletType);
      
      return {
        success: true,
        address: result.address
      };
    } catch (error: any) {
      lastError = error;
      logDebug('WALLET_CONNECTION', `Connection attempt ${attempts} failed: ${error.message}`);
      
      // If user rejected, don't retry
      if (error.message?.includes('rejected') || error.code === 4001) {
        break;
      }
      
      // Wait before retrying
      if (attempts < MAX_CONNECTION_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, CONNECTION_RETRY_DELAY));
      }
    }
  }

  // All attempts failed
  const errorMessage = lastError?.message || `Failed to connect to ${walletType} after multiple attempts`;
  logDebug('WALLET_CONNECTION', `All connection attempts failed: ${errorMessage}`);
  
  return {
    success: false,
    address: null,
    error: errorMessage
  };
}

/**
 * Ensure the wallet provider is available
 */
async function ensureProviderAvailable(walletType: WalletType): Promise<boolean> {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      switch (walletType) {
        case 'phantom':
          if ((window as any).phantom?.solana) {
            // Test if the provider is responsive
            try {
              const isConnected = (window as any).phantom.solana.isConnected;
              return true;
            } catch (e) {
              // Provider exists but isn't ready yet
              console.warn('Phantom provider not ready yet');
            }
          }
          break;
        case 'metamask':
          if ((window as any).ethereum?.isMetaMask) {
            return true;
          }
          break;
        case 'solflare':
          if ((window as any).solflare) {
            return true;
          }
          break;
      }
    } catch (e) {
      // Ignore errors and retry
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // If wallet not available, check if we should open installation page
  if (walletType === 'phantom' && !(window as any).phantom?.solana) {
    window.open('https://phantom.app/', '_blank');
  } else if (walletType === 'solflare' && !(window as any).solflare) {
    window.open('https://solflare.com/download', '_blank');
  } else if (walletType === 'metamask' && !(window as any).ethereum?.isMetaMask) {
    window.open('https://metamask.io/download/', '_blank');
  }
  
  throw new Error(`${walletType} provider not available after ${maxAttempts} attempts`);
}

/**
 * Clear any stale wallet connection data
 */
function clearStaleWalletData() {
  // Check if there's a stale connection (older than 1 hour)
  const connectedAt = localStorage.getItem('walletConnectedAt');
  if (connectedAt) {
    const connectedTime = parseInt(connectedAt);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    if (connectedTime < oneHourAgo) {
      logDebug('WALLET_CONNECTION', 'Clearing stale wallet connection data');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      localStorage.removeItem('walletConnectedAt');
    }
  }
}

/**
 * Dispatch wallet connection events
 */
function dispatchWalletEvents(address: string, walletType: WalletType) {
  // Ensure address is a string
  const addressStr = String(address);
  
  // Dispatch wallet changed event
  window.dispatchEvent(new CustomEvent('walletChanged', {
    detail: {
      action: 'connected',
      wallet: addressStr,
      walletType
    }
  }));
  
  // Dispatch wallet session changed event
  window.dispatchEvent(new CustomEvent('walletSessionChanged', {
    detail: {
      walletAddress: addressStr,
      walletType
    }
  }));
  
  // Dispatch global wallet connected event
  window.dispatchEvent(new CustomEvent('globalWalletConnected', {
    detail: {
      address: addressStr,
      walletType,
      connected: true,
      network: localStorage.getItem('activeNetwork') || 'testnet'
    }
  }));
}

/**
 * Connect to Phantom wallet with reliable error handling
 */
export async function connectToPhantom(): Promise<{ success: boolean; address: string | null; error?: string }> {
  return connectWalletSafely('phantom', async () => {
    // Ensure phantom is available
    if (!((window as any).phantom?.solana)) {
      throw new Error('Phantom wallet not found');
    }
    
    try {
      // Try to disconnect first to ensure clean state
      try {
        if ((window as any).phantom.solana.isConnected) {
          await (window as any).phantom.solana.disconnect();
          // Small delay after disconnect
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (e) {
        // Ignore disconnect errors
        console.warn('Error disconnecting from Phantom:', e);
      }
      
      // Add console logs for debugging
      console.log('Connecting to Phantom wallet...');
      
      // Connect with explicit timeout
      const connectPromise = (window as any).phantom.solana.connect({
        onlyIfTrusted: false
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timed out')), 30000);
      });
      
      // Race the connection promise against the timeout
      const response = await Promise.race([connectPromise, timeoutPromise]);
      console.log('Phantom connection response:', response);
      
      if (!response || !response.publicKey) {
        throw new Error('Invalid connection response');
      }
      
      const address = response.publicKey.toString();
      console.log('Connected to Phantom wallet:', address);
      return { address };
    } catch (error) {
      console.error('Phantom connection error:', error);
      throw error;
    }
  });
}

/**
 * Connect to MetaMask wallet with reliable error handling
 */
export async function connectToMetaMask(): Promise<{ success: boolean; address: string | null; error?: string }> {
  return connectWalletSafely('metamask', async () => {
    // Ensure ethereum is available
    if (!((window as any).ethereum)) {
      throw new Error('MetaMask not found');
    }
    
    // Find the MetaMask provider if there are multiple providers
    let provider = (window as any).ethereum;
    if ((window as any).ethereum.providers?.length > 0) {
      const metaMaskProvider = (window as any).ethereum.providers.find((p: any) => 
        p.isMetaMask && !p.isCoinbaseWallet && !p._isCoinbaseWallet
      );
      if (metaMaskProvider) {
        provider = metaMaskProvider;
      }
    }
    
    try {
      console.log('Connecting to MetaMask wallet...');
      
      // Request accounts with explicit error handling
      let accounts;
      try {
        accounts = await provider.request({
          method: 'eth_requestAccounts'
        });
        console.log('MetaMask accounts:', accounts);
      } catch (requestError: any) {
        console.error('MetaMask request error:', requestError);
        
        // Handle specific MetaMask errors
        if (requestError.code === 4001) {
          throw new Error('Connection rejected by user');
        } else if (requestError.code === -32002) {
          throw new Error('MetaMask is already processing a request. Please check your MetaMask extension.');
        } else if (requestError.code === -32603) {
          throw new Error('MetaMask internal error. Please restart your browser and try again.');
        }
        
        throw new Error(requestError.message || 'Failed to request accounts from MetaMask');
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in MetaMask');
      }
      
      const address = accounts[0];
      console.log('Connected to MetaMask wallet:', address);
      
      return { address };
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      throw error;
    }
  });
}

/**
 * Connect to Solflare wallet with reliable error handling
 */
export async function connectToSolflare(): Promise<{ success: boolean; address: string | null; error?: string }> {
  return connectWalletSafely('solflare', async () => {
    // Ensure solflare is available
    if (!((window as any).solflare)) {
      throw new Error('Solflare wallet not found');
    }
    
    try {
      // Try to disconnect first to ensure clean state
      try {
        if ((window as any).solflare.isConnected) {
          await (window as any).solflare.disconnect();
          // Small delay after disconnect
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (e) {
        // Ignore disconnect errors
      }
      
      // Connect with explicit timeout
      const connectPromise = (window as any).solflare.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timed out')), 30000);
      });
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      if (!((window as any).solflare.publicKey)) {
        throw new Error('Invalid connection response');
      }
      
      const address = (window as any).solflare.publicKey.toString();
      return { address };
    } catch (error) {
      console.error('Solflare connection error:', error);
      throw error;
    }
  });
}
