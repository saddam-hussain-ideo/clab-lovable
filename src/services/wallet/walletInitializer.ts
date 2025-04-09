
import { walletRegistry } from './walletRegistry';
import { metamaskProvider } from './providers/metamaskProvider';
import { phantomProvider } from './providers/phantomProvider';
import { phantom_ethereumProvider } from './providers/phantom_ethereumProvider';
import { logDebug } from '@/utils/debugLogging';

/**
 * Initialize all wallet providers and prepare for connection
 */
export function initializeWalletProviders() {
  try {
    logDebug('WALLET_INIT', 'Initializing wallet providers');
    
    // Ensure MetaMask provider is registered
    if (!walletRegistry.getProvider('metamask')) {
      walletRegistry.registerProvider(metamaskProvider);
      logDebug('WALLET_INIT', 'Registered MetaMask provider');
    }
    
    // Ensure Phantom Solana provider is registered
    if (!walletRegistry.getProvider('phantom')) {
      walletRegistry.registerProvider(phantomProvider);
      logDebug('WALLET_INIT', 'Registered Phantom Solana provider');
    }
    
    // Ensure Phantom Ethereum provider is registered
    if (!walletRegistry.getProvider('phantom_ethereum')) {
      walletRegistry.registerProvider(phantom_ethereumProvider);
      logDebug('WALLET_INIT', 'Registered Phantom Ethereum provider');
    }
    
    logDebug('WALLET_INIT', 'All wallet providers initialized');
    
    return true;
  } catch (error) {
    console.error('Error initializing wallet providers:', error);
    return false;
  }
}

// Call this function early in your application startup
// e.g., in your main.tsx or in a context provider
export function setupWalletSystem() {
  initializeWalletProviders();
  
  // Check for existing connections
  const walletType = localStorage.getItem('walletType');
  const walletAddress = localStorage.getItem('walletAddress');
  
  if (walletType && walletAddress) {
    logDebug('WALLET_INIT', `Found existing wallet connection: ${walletType} - ${walletAddress}`);
    
    // Verify the connection is still valid (async)
    const verifyConnection = async () => {
      const provider = walletRegistry.getProvider(walletType as any);
      
      if (provider) {
        const isStillConnected = await provider.verifyConnection();
        
        if (!isStillConnected) {
          logDebug('WALLET_INIT', `Stored wallet connection is no longer valid: ${walletType}`);
          // Clear the stored connection
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('walletType');
          localStorage.removeItem('walletConnectedAt');
        } else {
          logDebug('WALLET_INIT', `Verified existing connection to ${walletType}: ${walletAddress}`);
          
          // Dispatch global wallet event
          window.dispatchEvent(new CustomEvent('walletChanged', {
            detail: {
              action: 'connected',
              wallet: walletAddress,
              walletType: walletType
            }
          }));
        }
      }
    };
    
    verifyConnection();
  }
}
