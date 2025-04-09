
import { WalletProvider, WalletConnectionResult, WalletConnectionOptions } from "../walletService";
import { logDebug } from "@/utils/debugLogging";
import { toast } from "sonner";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { WalletConnectModal } from "@walletconnect/modal";

// WalletConnect project ID - required for WalletConnect v2
const PROJECT_ID = "6c52f34647d6b0874e74b1523f918842";

// Create WalletConnect modal
const modal = new WalletConnectModal({
  projectId: PROJECT_ID,
  themeMode: "dark",
  themeVariables: {
    "--wcm-font-family": "'Inter', sans-serif",
    "--wcm-accent-color": "#8b5cf6",
    "--wcm-accent-fill-color": "#ffffff",
    "--wcm-background-color": "#1e1e1e",
  }
});

// Define a variable to hold the provider instance 
// Use the correct import type by referencing the specific EthereumProvider type
let provider: Awaited<ReturnType<typeof EthereumProvider.init>> | null = null;

export const walletConnectProvider: WalletProvider = {
  id: "walletconnect",
  name: "WalletConnect",
  description: "Connect with WalletConnect",
  logo: "/lovable-uploads/d9c9632f-b497-4efa-bdd3-f92baeb243e7.png", // Generic WalletConnect logo
  networks: ["mainnet", "testnet"],
  chains: ["ethereum"],
  
  isAvailable: () => {
    // WalletConnect is always available as it's a web-based solution
    return true;
  },
  
  connect: async (options?: WalletConnectionOptions): Promise<WalletConnectionResult> => {
    try {
      logDebug('WALLET', 'Connecting to WalletConnect...');
      
      // Initialize WalletConnect provider if not already done
      if (!provider) {
        provider = await EthereumProvider.init({
          projectId: PROJECT_ID,
          chains: [1], // Ethereum mainnet by default
          optionalChains: [5, 11155111], // Goerli and Sepolia testnets
          showQrModal: true,
          metadata: {
            name: "YourApp",
            description: "Your app description",
            url: window.location.origin,
            icons: [`${window.location.origin}/logo.png`]
          }
        });
      }
      
      // Connect to WalletConnect
      await provider.connect();
      
      // Get account information
      const accounts = await provider.request({ 
        method: 'eth_accounts'
      }) as string[];
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found after connecting WalletConnect');
      }
      
      const address = accounts[0];
      
      logDebug('WALLET', `Connected to WalletConnect with address: ${address}`);
      
      // Save connection in localStorage
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletType', 'walletconnect');
      localStorage.setItem('walletConnectedAt', Date.now().toString());
      
      // Dispatch wallet change event
      window.dispatchEvent(new CustomEvent('walletChanged', {
        detail: { action: 'connected', address, type: 'walletconnect' }
      }));
      
      return {
        success: true,
        address: address,
        type: 'walletconnect'
      };
    } catch (error: any) {
      console.error('Error connecting to WalletConnect:', error);
      logDebug('WALLET', `WalletConnect error: ${error.message}`);
      
      // Clean up any failed connections
      if (provider) {
        try {
          await provider.disconnect();
        } catch (e) {
          console.warn('Error disconnecting failed WalletConnect session:', e);
        }
      }
      
      return {
        success: false,
        error: error.message || 'Failed to connect with WalletConnect',
        address: null,
        type: null
      };
    }
  },
  
  disconnect: async (): Promise<boolean> => {
    try {
      if (provider) {
        await provider.disconnect();
        provider = null;
      }
      
      // Clear local storage
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      localStorage.removeItem('walletConnectedAt');
      
      logDebug('WALLET', 'Disconnected from WalletConnect');
      return true;
    } catch (error) {
      console.error('Error disconnecting WalletConnect:', error);
      return false;
    }
  },
  
  verifyConnection: async (): Promise<boolean> => {
    try {
      if (!provider) return false;
      
      const accounts = await provider.request({ 
        method: 'eth_accounts' 
      }) as string[];
      
      const isConnected = accounts && accounts.length > 0;
      return isConnected;
    } catch (error) {
      console.error('Error verifying WalletConnect connection:', error);
      return false;
    }
  },
  
  getAccounts: async (): Promise<string[]> => {
    try {
      if (!provider) return [];
      
      const accounts = await provider.request({ 
        method: 'eth_accounts' 
      }) as string[];
      
      return accounts || [];
    } catch (error) {
      console.error('Error getting WalletConnect accounts:', error);
      return [];
    }
  }
};
