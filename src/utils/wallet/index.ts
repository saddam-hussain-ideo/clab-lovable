import { WalletType } from "@/services/wallet/walletService";
import { logDebug, PhantomConnectOptions } from "@/utils/debugLogging";

/**
 * Utility functions for wallet interactions
 */

// Wallet network types
export type Network = 'mainnet-beta' | 'devnet' | 'testnet';

/**
 * Check if a wallet is connected and perform verification
 * without triggering wallet connection prompts
 */
export async function verifyWalletConnection(): Promise<boolean> {
  try {
    const walletType = localStorage.getItem('walletType');
    const walletAddress = localStorage.getItem('walletAddress');
    
    if (!walletType || !walletAddress) {
      return false;
    }
    
    // Check for specific wallet types
    if (walletType === 'phantom') {
      if (!window.phantom?.solana) {
        return false;
      }
      
      // Instead of trying to connect, just check if it's already connected
      if (window.phantom.solana.isConnected && window.phantom.solana.publicKey) {
        return true;
      }
      return false;
    }
    
    if (walletType === 'solflare') {
      if (!window.solflare) {
        return false;
      }
      
      // Just check if Solflare is connected without trying to connect
      if (window.solflare.isConnected && window.solflare.publicKey) {
        return true;
      }
      return false;
    }
    
    return false;
  } catch (e) {
    console.error('Error verifying wallet connection:', e);
    return false;
  }
}

/**
 * Request a wallet recheck by dispatching a custom event
 */
export function requestWalletRecheck() {
  // Check if we're making too many rechecks - throttle if needed
  const lastRecheckTime = localStorage.getItem('lastWalletRecheckTime');
  const now = Date.now();
  
  if (lastRecheckTime) {
    const timeSinceLastRecheck = now - parseInt(lastRecheckTime, 10);
    if (timeSinceLastRecheck < 10000) { // 10 seconds throttle
      logDebug('WALLET', 'Throttling wallet recheck request - too frequent');
      return;
    }
  }
  
  localStorage.setItem('lastWalletRecheckTime', now.toString());
  window.dispatchEvent(new CustomEvent('verifyWalletConnection'));
  logDebug('WALLET', 'Requested wallet recheck via event dispatch');
}

/**
 * Attempt to connect to the Phantom wallet
 * @param options PhantomConnectOptions
 */
export async function attemptPhantomConnect(options?: PhantomConnectOptions): Promise<boolean> {
  try {
    if (!window.phantom?.solana) {
      console.error('Phantom wallet not detected');
      return false;
    }
    
    // Connect with the provided options or default to onlyIfTrusted: true
    const connectOptions = options || { onlyIfTrusted: true };
    await window.phantom.solana.connect(connectOptions);
    
    return window.phantom.solana.isConnected;
  } catch (error) {
    console.error('Phantom wallet connection error:', error);
    return false;
  }
}

/**
 * Clear all wallet state from local storage and memory
 */
export async function clearWalletState(): Promise<boolean> {
  try {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletConnectedAt');
    localStorage.removeItem('walletExplicitDisconnect');
    
    logDebug('WALLET', 'Cleared wallet state from localStorage');
    
    // If Phantom is available, try to disconnect it
    if (window.phantom?.solana) {
      try {
        await window.phantom.solana.disconnect();
        logDebug('WALLET', 'Successfully disconnected Phantom wallet');
      } catch (err) {
        console.error('Error disconnecting Phantom wallet:', err);
      }
    }
    
    // If Solflare is available, try to disconnect it
    if (window.solflare) {
      try {
        await window.solflare.disconnect();
        logDebug('WALLET', 'Successfully disconnected Solflare wallet');
      } catch (err) {
        console.error('Error disconnecting Solflare wallet:', err);
      }
    }
    
    return true;
  } catch (e) {
    console.error('Error clearing wallet state:', e);
    return false;
  }
}

/**
 * Set an explicit disconnect flag to indicate the user manually disconnected
 */
export function setExplicitDisconnectFlag(value: boolean = true): void {
  if (value) {
    localStorage.setItem('walletExplicitDisconnect', 'true');
    logDebug('WALLET', 'Set explicit disconnect flag in localStorage');
  } else {
    localStorage.removeItem('walletExplicitDisconnect');
    logDebug('WALLET', 'Removed explicit disconnect flag from localStorage');
  }
}

/**
 * Get the currently active network preference
 */
export function getActiveNetwork(): 'mainnet' | 'testnet' {
  // Always default to mainnet for production
  return localStorage.getItem('activeNetwork') === 'testnet' ? 'testnet' : 'mainnet';
}

/**
 * Set the active network preference
 */
export function setActiveNetwork(network: 'mainnet' | 'testnet'): void {
  localStorage.setItem('activeNetwork', network);
  logDebug('WALLET', `Set active network to ${network}`);
  
  // Dispatch an event to notify components of the network change
  window.dispatchEvent(new CustomEvent('networkChanged', {
    detail: { network }
  }));
}

/**
 * Get the blockchain network based on the active network
 * This can now be context-aware when given an override
 */
export function getBlockchainNetwork(override?: string): 'solana' | 'ethereum' {
  // If override is provided, use it directly
  if (override === 'solana' || override === 'ethereum') {
    return override;
  }
  
  // Check for preferred blockchain in localStorage (set by RpcContext)
  const preferredBlockchain = localStorage.getItem('preferredBlockchain');
  if (preferredBlockchain === 'solana' || preferredBlockchain === 'ethereum') {
    return preferredBlockchain;
  }
  
  // Fall back to wallet type-based detection
  const walletType = localStorage.getItem('walletType');
  if (walletType === 'metamask' || walletType === 'phantom_ethereum') {
    return 'ethereum';
  }
  
  return 'solana';
}

/**
 * Always returns 'mainnet-beta' for Solana network to ensure production use
 * @returns 'mainnet-beta'
 */
export function getSolanaNetwork(): 'mainnet-beta' {
  // Always use mainnet for production
  return 'mainnet-beta';
}

/**
 * Get the current wallet address from local storage
 */
export function getCurrentWalletAddress(): string | null {
  return localStorage.getItem('walletAddress');
}

/**
 * Get the appropriate wallet provider for the given network
 */
export function getWalletForNetwork(network: Network) {
  // Implementation would depend on your wallet integration
  return window.phantom?.solana;
}

/**
 * Validate if an address is a valid blockchain address
 * This is a generic wrapper for more specific validation functions
 */
export function isValidBlockchainAddress(address: string): boolean {
  return isValidSolanaAddress(address) || isValidEthereumAddress(address);
}

/**
 * Validate if an address is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Simple validation: Solana addresses are 44 characters long and base58 encoded
  if (!address || typeof address !== 'string') return false;
  
  // Base58 character set: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate if an address is a valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  // Ethereum addresses are 42 characters long, starting with 0x and containing hexadecimal characters
  if (!address || typeof address !== 'string') return false;
  
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumRegex.test(address);
}
