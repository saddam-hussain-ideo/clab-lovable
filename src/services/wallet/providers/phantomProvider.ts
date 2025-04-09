import { WalletType, WalletConnectionResult, WalletConnectionOptions, WalletProvider, walletService } from "../walletService";
import { logDebug, PhantomConnectOptions } from "@/utils/debugLogging";

/**
 * Phantom Wallet Provider
 * Implements the wallet provider interface
 */
export class PhantomProvider implements WalletProvider {
  public id = "phantom" as WalletType;
  public name = "Phantom";
  public description = "Phantom is a friendly Solana wallet built for DeFi & NFTs";
  public logo = "https://www.phantom.app/img/logo.png";
  public networks = ['mainnet', 'testnet'] as ('mainnet' | 'testnet')[];
  public chains = ['solana'] as ('ethereum' | 'solana')[];

  constructor() {
    // Initialize provider
  }

  /**
   * Check if Phantom is available
   */
  isAvailable = (): boolean => {
    try {
      const phantom = getPhantomProvider();
      return !!phantom?.isPhantom;
    } catch (error) {
      return false;
    }
  };

  /**
   * Get Phantom provider
   */
  getProvider = () => {
    return getPhantomProvider();
  };

  /**
   * Connect to Phantom wallet
   * @param options - Connection options
   */
  connect = async (options?: WalletConnectionOptions): Promise<WalletConnectionResult> => {
    try {
      // Wait for Phantom to be properly initialized
      let retries = 0;
      let phantomProvider;
      
      while (retries < 3) {
        try {
          phantomProvider = (window as any).phantom?.solana;
          if (phantomProvider?.isPhantom) {
            // Test if the provider is responsive
            const resp = await phantomProvider.request({ 
              method: 'connect',
              params: { onlyIfTrusted: true }
            }).catch(() => null);
            
            if (resp !== null) {
              break;
            }
          }
        } catch (e) {
          console.warn('Phantom not ready, retrying...', e);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }

      if (!phantomProvider?.isPhantom) {
        logDebug('WALLET', 'Phantom not available after retries');
        return { 
          success: false, 
          error: "Phantom not available. Please ensure the extension is installed and refresh the page.",
          address: null,
          type: null
        };
      }

      // Clear any existing connection state
      await this.disconnect();
      
      // Wait a moment to ensure disconnection is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Connect with explicit options
        const connectResponse = await phantomProvider.connect({
          onlyIfTrusted: false
        });
        
        // Verify connection state immediately
        if (!phantomProvider.isConnected || !phantomProvider.publicKey) {
          throw new Error('Connection failed - invalid state');
        }
        
        const address = phantomProvider.publicKey.toString();
        logDebug('WALLET', `Phantom connected successfully: ${address}`);
        
        // Store connection in wallet service
        await walletService.handleSuccessfulConnection(address, 'phantom');
        
        // Dispatch global wallet connected event
        window.dispatchEvent(new CustomEvent('globalWalletConnected', { 
          detail: { 
            address, 
            walletType: 'phantom',
            connected: true,
            network: localStorage.getItem('activeNetwork') || 'testnet'
          }
        }));
        
        return {
          success: true,
          address,
          type: 'phantom'
        };
      } catch (error) {
        // Handle connection errors
        logDebug('WALLET', `Phantom connection error: ${error.message}`);
        
        // Check if user rejected
        if (error.code === 4001) {
          return {
            success: false,
            error: "Connection rejected by user",
            address: null,
            type: null
          };
        }
        
        return {
          success: false,
          error: error.message || 'Failed to connect to Phantom',
          address: null,
          type: null
        };
      }
    } catch (error) {
      console.error('Phantom connection error:', error);
      logDebug('WALLET', `Phantom connection error: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to connect to Phantom',
        address: null,
        type: null
      };
    }
  };

  /**
   * Verify connection state without triggering a connection
   */
  verifyConnection = async (): Promise<boolean> => {
    try {
      const phantomProvider = (window as any).phantom?.solana;
      
      if (!phantomProvider) {
        logDebug('WALLET', 'PhantomProvider.verifyConnection: No provider found');
        return false;
      }
      
      // First check isConnected property
      if (!phantomProvider.isConnected) {
        logDebug('WALLET', 'PhantomProvider.verifyConnection: Not connected according to isConnected property');
        return false;
      }
      
      // Then verify we have a publicKey without prompting
      const hasPublicKey = !!phantomProvider.publicKey;
      logDebug('WALLET', `PhantomProvider.verifyConnection: Has publicKey: ${hasPublicKey}`);
      
      // Both conditions must be true to consider properly connected
      return hasPublicKey;
    } catch (error) {
      console.error("Error verifying Phantom connection:", error);
      logDebug('WALLET', `PhantomProvider.verifyConnection error: ${error}`);
      return false;
    }
  };

  disconnect = async (): Promise<boolean> => {
    try {
      const phantomProvider = getPhantomProvider();
      if (phantomProvider && phantomProvider.disconnect) {
        await phantomProvider.disconnect();
      }
      
      // Clear wallet service state
      walletService.clearWalletConnection();
      
      // Dispatch disconnection event
      window.dispatchEvent(new CustomEvent('globalWalletConnected', {
        detail: { 
          connected: false,
          error: null
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error disconnecting Phantom:', error);
      return false;
    }
  };

  /**
   * Get Phantom wallet accounts
   * IMPORTANT: This method should not prompt the user or initiate a connection
   */
  getAccounts = async (): Promise<string[]> => {
    try {
      logDebug('WALLET', 'PhantomProvider.getAccounts: Getting accounts without prompting');
      const phantomProvider = getPhantomProvider();
      
      // First ensure we have a provider and it's reporting as connected
      if (!phantomProvider) {
        logDebug('WALLET', 'PhantomProvider.getAccounts: No provider found');
        return [];
      }
      
      if (!phantomProvider.isConnected) {
        logDebug('WALLET', 'PhantomProvider.getAccounts: Provider reports not connected');
        return [];
      }
      
      // Check for publicKey property - this should not trigger a connection
      if (!phantomProvider.publicKey) {
        logDebug('WALLET', 'PhantomProvider.getAccounts: No publicKey available');
        return [];
      }
      
      const address = phantomProvider.publicKey.toString();
      logDebug('WALLET', `PhantomProvider.getAccounts: Found account: ${address}`);
      return [address];
    } catch (error) {
      console.error("Phantom getAccounts error:", error);
      logDebug('WALLET', `PhantomProvider.getAccounts error: ${error}`);
      return [];
    }
  };

  /**
   * Sign a message with Phantom wallet
   * @param message - Message to sign
   */
  signMessage = async (message: string): Promise<Uint8Array | null> => {
    try {
      const phantomProvider = getPhantomProvider();
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await phantomProvider.signMessage(encodedMessage);
      return signedMessage.signature;
    } catch (error) {
      console.error("Phantom signMessage error:", error);
      return null;
    }
  };

  /**
   * Sign a transaction with Phantom wallet
   * @param transaction - Transaction to sign
   */
  signTransaction = async (transaction: any): Promise<any | null> => {
    try {
      const phantomProvider = getPhantomProvider();
      const signedTransaction = await phantomProvider.signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      console.error("Phantom signTransaction error:", error);
      return null;
    }
  };

  /**
   * Sign all transactions with Phantom wallet
   * @param transactions - Transactions to sign
   */
  signAllTransactions = async (transactions: any[]): Promise<any[] | null> => {
    try {
      const phantomProvider = getPhantomProvider();
      const signedTransactions = await phantomProvider.signAllTransactions(transactions);
      return signedTransactions;
    } catch (error) {
      console.error("Phantom signAllTransactions error:", error);
      return null;
    }
  };
}

/**
 * Get Phantom provider from window
 * This should be a read-only operation and never trigger a connection
 */
const getPhantomProvider = (): any => {
  if (typeof window !== "undefined") {
    const provider = (window as any).phantom?.solana;
    if (provider) {
      return provider;
    } else {
      console.warn("Phantom provider not found");
      return null;
    }
  } else {
    console.warn("window is not defined");
    return null;
  }
};

// Export an instance for use in the registry
export const phantomProvider = new PhantomProvider();
