
// Common types for wallet connections
export interface WalletConnectionResult {
  success: boolean;
  address?: string | null;
  type?: string | null;
  error?: string;
}

export interface WalletConnectionHookResult {
  isConnecting: boolean;
  isConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
  connectWallet: (walletName: string) => Promise<WalletConnectionResult>;
  disconnectWallet: () => Promise<WalletConnectionResult>;
  checkStoredWallet: () => { address: string; type: string } | null;
  clearExistingConnections: () => Promise<void>;
  withRetryBackoff: <T>(fn: () => Promise<T>, maxRetries?: number) => Promise<T>;
  restoreWalletProfile: (walletAddress: string, walletType?: string) => Promise<boolean>;
}

// Local storage utility functions
export const getStoredWallet = (): { address: string; type: string } | null => {
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
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      localStorage.removeItem('walletConnectedAt');
    }
  }
  
  return null;
};
