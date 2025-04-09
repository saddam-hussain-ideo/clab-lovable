
import { WalletProvider, WalletConnectionResult, WalletConnectionOptions, walletService, WalletType } from "../walletService";
import { toast } from "sonner";
import { connectPhantomEthereumWallet, disconnectPhantomEthereum, isPhantomEthereumAvailable, verifyPhantomEthereumConnection } from "@/utils/wallet/phantom";
import { logDebug } from "@/utils/debugLogging";

export const phantom_ethereumProvider: WalletProvider = {
  id: "phantom_ethereum",
  name: "Phantom (Ethereum)",
  description: "Connect to Ethereum networks with Phantom",
  iconUrl: "https://www.phantom.app/img/logo.png",
  networks: ['mainnet', 'testnet'],
  chains: ['ethereum'],
  
  isAvailable: () => {
    const available = isPhantomEthereumAvailable();
    logDebug('WALLET', `Phantom Ethereum availability check: ${available}`);
    return available;
  },
  
  connect: async (options?: WalletConnectionOptions): Promise<WalletConnectionResult> => {
    try {
      logDebug('WALLET', 'Attempting to connect to Phantom Ethereum wallet');
      
      const forcePrompt = options?.forcePrompt === true;
      logDebug('WALLET', `Connecting to Phantom Ethereum with forcePrompt: ${forcePrompt}`);
      
      // Connect to Phantom Ethereum
      const address = await connectPhantomEthereumWallet(forcePrompt);
      
      if (!address) {
        return {
          success: false,
          error: 'No address returned from Phantom Ethereum',
          address: null,
          type: null
        };
      }
      
      logDebug('WALLET', `Phantom Ethereum connected successfully with address: ${address}`);
      
      // Store connection in wallet service
      await walletService.handleSuccessfulConnection(address, 'phantom_ethereum');
      
      toast.success("Successfully connected to Phantom Ethereum wallet");
      
      return {
        success: true,
        address,
        type: 'phantom_ethereum'
      };
    } catch (error: any) {
      console.error('Error connecting Phantom Ethereum:', error);
      
      // Handle specific errors
      let errorMessage = 'Failed to connect Phantom Ethereum';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      logDebug('WALLET', `Phantom Ethereum connection error: ${errorMessage}`);
      
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
      logDebug('WALLET', 'Disconnecting Phantom Ethereum wallet');
      
      const success = await disconnectPhantomEthereum();
      
      if (success) {
        toast.success("Disconnected from Phantom Ethereum wallet");
        walletService.clearWalletConnection();
        walletService.dispatchWalletEvent(false);
      }
      
      return success;
    } catch (error) {
      console.error('Error disconnecting Phantom Ethereum wallet:', error);
      toast.error("Failed to disconnect from Phantom Ethereum wallet");
      return false;
    }
  },
  
  verifyConnection: async (): Promise<boolean> => {
    try {
      // Check localStorage first instead of the provider
      const walletType = localStorage.getItem('walletType');
      const walletAddress = localStorage.getItem('walletAddress');
      
      // If this isn't a phantom_ethereum connection in localStorage, fail fast
      if (walletType !== 'phantom_ethereum' || !walletAddress) {
        logDebug('WALLET', 'Phantom Ethereum verification failed: no valid connection in localStorage');
        return false;
      }
      
      // Now we can check the provider since we know we should have a connection
      const address = await verifyPhantomEthereumConnection();
      const connected = !!address;
      
      // Also verify address matches
      const addressMatches = address && address.toLowerCase() === walletAddress.toLowerCase();
      const isConnected = connected && addressMatches;
      
      logDebug('WALLET', `Phantom Ethereum verification result: ${isConnected ? 'connected' : 'disconnected'}`);
      if (isConnected) {
        logDebug('WALLET', `Phantom Ethereum connected to address: ${address}`);
      }
      
      return isConnected;
    } catch (error) {
      console.error('Error verifying Phantom Ethereum connection:', error);
      return false;
    }
  },
  
  getAccounts: async (): Promise<string[]> => {
    try {
      // Check localStorage first to avoid unnecessary provider calls
      const walletType = localStorage.getItem('walletType');
      const walletAddress = localStorage.getItem('walletAddress');
      
      // If this is a phantom_ethereum connection in localStorage, return the address
      if (walletType === 'phantom_ethereum' && walletAddress) {
        logDebug('WALLET', `Using cached Phantom Ethereum account from localStorage: ${walletAddress}`);
        return [walletAddress];
      }
      
      // Only check the connection if we have a stored wallet
      if (walletType === 'phantom_ethereum') {
        const address = await verifyPhantomEthereumConnection();
        return address ? [address] : [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting Phantom Ethereum accounts:', error);
      return [];
    }
  }
};
