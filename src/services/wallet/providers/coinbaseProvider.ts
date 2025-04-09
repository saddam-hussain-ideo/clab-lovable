
import { WalletProvider, WalletConnectionResult, WalletType, WalletConnectionOptions, walletService } from "../walletService";
import { logDebug } from "@/utils/debugLogging";
import { getCoinbaseProvider, isCoinbaseInstalled } from "@/utils/wallet/coinbase";
import { withRetry } from "@/utils/retry/retryUtils";

export const coinbaseProvider: WalletProvider = {
  id: "coinbase",
  name: "Coinbase Wallet",
  description: "Connect with Coinbase Wallet",
  iconUrl: "https://static.coinbase.com/assets/coinbase-icon.svg",
  networks: ['mainnet', 'testnet'],
  chains: ['ethereum'],
  
  isAvailable: () => {
    const available = isCoinbaseInstalled();
    
    // Log availability for debugging
    logDebug('WALLET', `Coinbase Wallet availability check: ${available}`);
    console.log("Coinbase Wallet available:", available);
    return available;
  },
  
  connect: async (): Promise<WalletConnectionResult> => {
    try {
      logDebug('WALLET', 'Attempting to connect to Coinbase Wallet');
      console.log('Connecting to Coinbase Wallet...');
      
      const provider = getCoinbaseProvider();
      
      if (!provider) {
        logDebug('WALLET', 'Coinbase Wallet is not installed or not detected');
        console.log('Coinbase Wallet not detected');
        return { 
          success: false, 
          error: 'Coinbase Wallet is not installed or was not detected',
          address: null,
          type: null
        };
      }
      
      // Force disconnect any existing wallet connections first
      await walletService.clearWalletConnection();
      
      // Use withRetry to handle potential network issues during connection
      const connectWithRetry = async () => {
        // Request accounts
        const accounts = await provider.request({ 
          method: 'eth_requestAccounts'
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found in Coinbase Wallet');
        }
        
        return accounts[0];
      };
      
      const address = await withRetry(connectWithRetry, {
        maxRetries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        factor: 1.5,
        context: 'Coinbase Wallet Connection',
        onRetry: (error, attempt) => {
          logDebug('WALLET', `Coinbase Wallet connection retry ${attempt}: ${error.message}`);
        }
      });
      
      if (!address) {
        logDebug('WALLET', 'No address returned from Coinbase Wallet');
        return {
          success: false,
          error: 'No address returned from Coinbase Wallet',
          address: null,
          type: null
        };
      }
      
      logDebug('WALLET', `Coinbase Wallet connected successfully with address: ${address}`);
      console.log(`Coinbase Wallet connected with address: ${address}`);
      
      // Store connection in wallet service
      await walletService.handleSuccessfulConnection(address, 'coinbase');
      
      return {
        success: true,
        address,
        type: 'coinbase'
      };
    } catch (error: any) {
      console.error('Error connecting Coinbase Wallet:', error);
      
      // Handle specific errors
      const errorMessage = error.code === 4001
        ? 'Connection rejected by user'
        : error.message || 'Failed to connect Coinbase Wallet';
      
      logDebug('WALLET', `Coinbase Wallet connection error: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        address: null,
        type: null
      };
    }
  },
  
  disconnect: async (): Promise<boolean> => {
    try {
      logDebug('WALLET', 'Disconnecting Coinbase Wallet');
      // Use the wallet service to ensure complete disconnection
      walletService.clearWalletConnection();
      walletService.dispatchWalletEvent(false);
      
      return true;
    } catch (error) {
      console.error('Error disconnecting Coinbase Wallet:', error);
      return false;
    }
  },
  
  verifyConnection: async (): Promise<boolean> => {
    try {
      const provider = getCoinbaseProvider();
      
      if (!provider) {
        logDebug('WALLET', 'Coinbase Wallet verification failed: provider not found');
        return false;
      }
      
      const accounts = await provider.request({ method: 'eth_accounts' });
      const isConnected = Array.isArray(accounts) && accounts.length > 0;
      
      logDebug('WALLET', `Coinbase Wallet verification result: ${isConnected ? 'connected' : 'disconnected'}`);
      if (isConnected) {
        logDebug('WALLET', `Coinbase Wallet connected to address: ${accounts[0]}`);
      }
      
      return isConnected;
    } catch (error) {
      console.error('Error verifying Coinbase Wallet connection:', error);
      return false;
    }
  },
  
  getAccounts: async (): Promise<string[]> => {
    try {
      const provider = getCoinbaseProvider();
      
      if (!provider) {
        return [];
      }
      
      const accounts = await provider.request({ method: 'eth_accounts' });
      return Array.isArray(accounts) ? accounts : [];
    } catch (error) {
      console.error('Error getting Coinbase Wallet accounts:', error);
      return [];
    }
  }
};
