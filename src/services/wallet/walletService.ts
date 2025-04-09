export type WalletType = 'metamask' | 'phantom_solana' | 'phantom_ethereum' | 'solflare' | 'walletconnect' | string;

export interface WalletConnectionOptions {
  forcePrompt?: boolean;
  redirectUrl?: string;
  network?: string;
  namespace?: 'solana' | 'eip155';
  filters?: {
    wallets?: string[];
  };
  [key: string]: any;
}

export interface WalletConnectionResult {
  success: boolean;
  address: string | null;
  type: WalletType | null;
  error?: string;
}

export interface WalletProvider {
  id: WalletType;
  name: string;
  description?: string;
  iconUrl?: string;
  logo?: string;
  networks?: string[];
  chains?: string[];
  isAvailable: () => boolean | Promise<boolean>;
  connect: (options?: WalletConnectionOptions) => Promise<WalletConnectionResult>;
  disconnect: () => Promise<boolean>;
  verifyConnection: () => Promise<boolean>;
  getAccounts?: () => Promise<string[]>;
}

export const walletService = {
  handleSuccessfulConnection: async (address: string, walletType: WalletType): Promise<boolean> => {
    try {
      console.log('[walletService] Successfully connected:', { address, walletType });
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletType', walletType);
      localStorage.setItem('walletConnectedAt', Date.now().toString());
      
      // Store network type
      const isSolana = walletType.includes('solana') || walletType === 'solflare';
      localStorage.setItem('walletNetwork', isSolana ? 'solana' : 'ethereum');
      
      window.dispatchEvent(new CustomEvent("walletChanged", {
        detail: { 
          action: 'connected', 
          wallet: {
            address: address,
            type: walletType,
            network: isSolana ? 'solana' : 'ethereum'
          }
        }
      }));
      
      window.dispatchEvent(new CustomEvent("walletSessionChanged", {
        detail: { 
          walletAddress: address,
          walletType: walletType,
          network: isSolana ? 'solana' : 'ethereum'
        }
      }));
      
      // Trigger profile loading after successful connection
      try {
        import('./walletSessionManager').then(({ walletSessionManager }) => {
          console.log(`[walletService] Triggering profile load for ${walletType} wallet`);
          walletSessionManager.loadProfileForCurrentWallet().then(profile => {
            if (profile) {
              console.log(`[walletService] Successfully loaded profile for ${walletType} wallet`);
            }
          }).catch(err => {
            console.error(`[walletService] Error loading profile for ${walletType} wallet:`, err);
          });
        });
      } catch (profileError) {
        console.error('[walletService] Error triggering profile load:', profileError);
      }
      
      return true;
    } catch (error) {
      console.error("Error handling successful connection:", error);
      return false;
    }
  },

  clearWalletConnection: () => {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletNetwork');
    localStorage.removeItem('walletConnectedAt');
    sessionStorage.removeItem(`wallet_synced_${localStorage.getItem('walletAddress')}`);
  },

  dispatchWalletEvent: (connected: boolean, address?: string, type?: WalletType) => {
    if (connected && address) {
      const isSolana = type?.includes('solana') || type === 'solflare';
      window.dispatchEvent(new CustomEvent("walletChanged", {
        detail: { 
          action: 'connected', 
          wallet: {
            address: address,
            type: type || 'unknown',
            network: isSolana ? 'solana' : 'ethereum'
          }
        }
      }));
      
      window.dispatchEvent(new CustomEvent("walletSessionChanged", {
        detail: { 
          walletAddress: address,
          walletType: type || 'unknown',
          network: isSolana ? 'solana' : 'ethereum'
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent("walletChanged", {
        detail: { action: 'disconnected', timestamp: Date.now() }
      }));
      
      window.dispatchEvent(new CustomEvent("walletSessionChanged", {
        detail: { 
          walletAddress: null,
          walletType: null,
          network: null
        }
      }));
    }
  },

  logConnection: async (walletAddress: string, walletType: string): Promise<boolean> => {
    console.log(`Logging connection for ${walletAddress} (${walletType})`);
    return true;
  },

  ensureWalletProfile: async (walletAddress: string, walletType: string): Promise<any> => {
    console.log(`Ensuring wallet profile for ${walletAddress} (${walletType})`);
    return {
      wallet_address: walletAddress,
      wallet_type: walletType,
      last_connected_at: new Date().toISOString()
    };
  },

  getWalletProfile: async (walletAddress: string): Promise<any> => {
    console.log(`Getting wallet profile for ${walletAddress}`);
    return {
      wallet_address: walletAddress,
      last_connected_at: new Date().toISOString()
    };
  },

  fetchWalletProfile: async (walletAddress: string, walletType: string = 'phantom'): Promise<any> => {
    console.log(`Fetching wallet profile for ${walletAddress} (${walletType})`);
    return {
      wallet_address: walletAddress,
      wallet_type: walletType,
      last_connected_at: new Date().toISOString()
    };
  },

  syncWalletProfile: async (
    walletAddress: string, 
    localProfile: any = null, 
    prioritizeDb: boolean = true,
    walletType: string = 'phantom'
  ): Promise<any> => {
    console.log(`Syncing wallet profile for ${walletAddress} (${walletType})`);
    return {
      wallet_address: walletAddress,
      wallet_type: walletType,
      last_connected_at: new Date().toISOString()
    };
  },

  updateWalletProfile: async (
    walletAddress: string,
    updateData: {
      username?: string;
      avatar_url?: string | null;
      points?: number;
      wallet_type?: string;
    },
    walletType: string = 'phantom'
  ): Promise<boolean> => {
    console.log(`Updating wallet profile for ${walletAddress} (${walletType}):`, updateData);
    return true;
  }
};
