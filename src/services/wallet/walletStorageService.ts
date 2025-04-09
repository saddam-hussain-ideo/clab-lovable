
import { logDebug } from "@/utils/debugLogging";

/**
 * Service for wallet connection storage in localStorage
 */
export const walletStorageService = {
  /**
   * Store wallet connection details
   */
  storeConnection(address: string, walletType: string): void {
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletType', walletType);
    localStorage.setItem('walletConnectedAt', Date.now().toString());
    
    // Mark this as an explicit user-initiated connection
    localStorage.setItem('walletExplicitConnect', 'true');
    
    logDebug('WALLET', `Stored wallet connection: ${address} (${walletType})`);
  },

  /**
   * Clear wallet connection details
   */
  clearConnection(): void {
    const currentAddress = localStorage.getItem('walletAddress');
    const currentType = localStorage.getItem('walletType');
    
    if (currentAddress && currentType) {
      logDebug('WALLET', `Clearing wallet connection: ${currentAddress} (${currentType})`);
    }
    
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletConnectedAt');
    localStorage.removeItem('walletExplicitConnect');
  },

  /**
   * Get stored wallet connection if valid
   */
  getConnection(): { address: string; type: string } | null {
    const storedAddress = localStorage.getItem('walletAddress');
    const storedType = localStorage.getItem('walletType');
    const connectedAt = localStorage.getItem('walletConnectedAt');
    
    if (storedAddress && storedType && connectedAt) {
      const connectedTime = parseInt(connectedAt, 10);
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (now - connectedTime < dayInMs) {
        return { address: storedAddress, type: storedType };
      } else {
        this.clearConnection();
      }
    }
    
    return null;
  },

  /**
   * Check if connection was explicitly initiated by user
   */
  wasExplicitConnection(): boolean {
    return localStorage.getItem('walletExplicitConnect') === 'true';
  },

  /**
   * Dispatch wallet connection event
   */
  dispatchWalletEvent(action: 'connected' | 'disconnected', address?: string, walletType?: string): void {
    if (action === 'connected' && address) {
      window.dispatchEvent(new CustomEvent('walletChanged', {
        detail: {
          action,
          wallet: address,
          walletType
        }
      }));
      
      logDebug('WALLET', `Dispatched wallet ${action} event for ${address} (${walletType})`);
    } else {
      window.dispatchEvent(new CustomEvent('walletChanged', {
        detail: {
          action
        }
      }));
      
      logDebug('WALLET', `Dispatched wallet ${action} event`);
    }
  }
};
