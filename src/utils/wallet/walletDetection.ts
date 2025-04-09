
/**
 * Utility functions for detecting installed wallet browser extensions
 */

import { logDebug } from '@/utils/debugLogging';
import { WalletType } from '@/services/wallet/walletService';

/**
 * Check if the Phantom wallet is installed (Solana version)
 */
export const isPhantomInstalled = (): boolean => {
  return typeof window !== 'undefined' && 
         window.phantom !== undefined && 
         window.phantom.solana !== undefined;
};

/**
 * Check if the Phantom wallet is installed (Ethereum version)
 */
export const isPhantomEthereumInstalled = (): boolean => {
  return typeof window !== 'undefined' && 
         window.phantom !== undefined && 
         window.phantom.ethereum !== undefined;
};

/**
 * Check if the Solflare wallet is installed
 */
export const isSolflareInstalled = (): boolean => {
  return typeof window !== 'undefined' && 
         window.solflare !== undefined;
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  // Basic check if window.ethereum exists and has isMetaMask flag
  const hasEthereum = typeof window !== 'undefined' && 
                       window.ethereum !== undefined;
  
  if (!hasEthereum) {
    return false;
  }
  
  // If we have multiple providers, check if any of them is MetaMask
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    return window.ethereum.providers.some(provider => 
      provider.isMetaMask && !provider.isCoinbaseWallet && !provider._isCoinbaseWallet
    );
  }
  
  // Otherwise check if the single provider is MetaMask
  return !!window.ethereum.isMetaMask && 
         !window.ethereum.isCoinbaseWallet && 
         !window.ethereum._isCoinbaseWallet;
};

/**
 * Check if WalletConnect can be used - only for Ethereum
 */
export const isWalletConnectAvailable = (): boolean => {
  return true; // For Ethereum only
};

/**
 * Check if a specific wallet type is installed/available
 */
export const isWalletInstalled = (type: WalletType): boolean => {
  switch (type) {
    case 'phantom':
      return isPhantomInstalled();
    case 'phantom_ethereum':
      return isPhantomEthereumInstalled();
    case 'solflare':
      return isSolflareInstalled();
    case 'metamask':
      return isMetaMaskInstalled();
    case 'walletconnect':
      return isWalletConnectAvailable();
    default:
      return false;
  }
};

/**
 * Get an array of all detected wallets
 */
export const getDetectedWallets = (): WalletType[] => {
  const wallets: WalletType[] = [];
  
  if (isPhantomInstalled()) wallets.push('phantom');
  if (isPhantomEthereumInstalled()) wallets.push('phantom_ethereum');
  if (isSolflareInstalled()) wallets.push('solflare');
  if (isMetaMaskInstalled()) wallets.push('metamask');
  
  logDebug('WALLET_DETECTION', `Detected wallets: ${wallets.join(', ')}`);
  
  return wallets;
};
