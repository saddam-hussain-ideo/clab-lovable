
import type { EthereumProvider } from "../../types/wallet-providers";
import { toast } from "sonner";
import { safelyAccessProperty } from "./safeAccess";

// Get the Coinbase wallet provider
export const getCoinbaseProvider = (): EthereumProvider | null => {
  console.group("Coinbase Provider Detection");
  
  if (typeof window === 'undefined' || !window.ethereum) {
    console.log("Coinbase provider not found: window.ethereum is undefined");
    console.groupEnd();
    return null;
  }

  // Debug window objects that might contain Coinbase wallet
  console.log("window.ethereum:", window.ethereum);
  console.log("window.coinbaseWallet:", (window as any).coinbaseWallet);
  
  // Look for explicit Coinbase provider
  if ((window as any).coinbaseWallet?.ethereum) {
    console.log("Found explicit window.coinbaseWallet provider");
    console.groupEnd();
    return (window as any).coinbaseWallet.ethereum;
  }
  
  // Check for providers array with Coinbase
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    console.log("Searching providers array for Coinbase Wallet");
    
    for (const provider of window.ethereum.providers) {
      console.log("Provider in array:", provider);
      if (provider.isCoinbaseWallet === true || provider._isCoinbaseWallet === true) {
        console.log("Found Coinbase provider in providers array");
        console.groupEnd();
        return provider;
      }
    }
  }
  
  // Check for single provider that is Coinbase
  if (window.ethereum.isCoinbaseWallet === true || 
      window.ethereum._isCoinbaseWallet === true) {
    console.log("Found Coinbase as single provider");
    console.groupEnd();
    return window.ethereum;
  }
  
  // Check for Coinbase provider using alternative detection
  if (safelyAccessProperty(window.ethereum, 'providerMap') && 
      safelyAccessProperty(window.ethereum, 'isCoinbaseWallet')) {
    console.log("Found Coinbase using providerMap detection");
    console.groupEnd();
    return window.ethereum;
  }

  // Check for walletLinkExtension (older Coinbase Wallet)
  if ((window as any).walletLinkExtension) {
    console.log("Found walletLinkExtension (older Coinbase Wallet)");
    console.groupEnd();
    return (window as any).walletLinkExtension;
  }
  
  console.log("No Coinbase provider found");
  console.groupEnd();
  return null;
};

// Check if Coinbase Wallet is available
export const isCoinbaseInstalled = (): boolean => {
  const provider = getCoinbaseProvider();
  const result = provider !== null;
  console.log("Coinbase installed check result:", result);
  return result;
};

// Connect to Coinbase wallet
export const connectCoinbase = async (): Promise<string | null> => {
  try {
    const provider = getCoinbaseProvider();
    
    if (!provider) {
      console.error("Coinbase provider not found");
      toast.error("Coinbase Wallet not found. Please install Coinbase Wallet extension.");
      return null;
    }
    
    console.log("Requesting account access from Coinbase provider");
    
    try {
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts'
      });
      
      if (accounts && accounts.length > 0) {
        console.log(`Connected to Coinbase Wallet with address: ${accounts[0]}`);
        
        // Store wallet info in localStorage
        localStorage.setItem('walletAddress', accounts[0]);
        localStorage.setItem('walletType', 'coinbase');
        localStorage.setItem('walletConnectedAt', Date.now().toString());
        
        // Dispatch wallet connection events
        window.dispatchEvent(new CustomEvent("walletChanged", {
          detail: { action: 'connected', wallet: accounts[0], walletType: 'coinbase' }
        }));
        
        window.dispatchEvent(new CustomEvent("globalWalletConnected", {
          detail: { address: accounts[0], walletType: 'coinbase' }
        }));
        
        return accounts[0];
      }
      
      console.error("No accounts returned from Coinbase Wallet");
      toast.error("No accounts returned from Coinbase Wallet. Please unlock your wallet and try again.");
      return null;
    } catch (error) {
      console.error("Error connecting to Coinbase Wallet:", error);
      toast.error("Failed to connect to Coinbase Wallet. Please try again.");
      return null;
    }
  } catch (error) {
    console.error("Error in connectCoinbase:", error);
    toast.error("Failed to connect to Coinbase Wallet. Please try again.");
    return null;
  }
};

// Disconnect from Coinbase wallet
export const disconnectCoinbase = async (): Promise<void> => {
  console.log("Coinbase disconnect called - clearing wallet data");
  
  // First try to dispatch disconnection event before clearing localStorage
  const walletAddress = localStorage.getItem('walletAddress');
  const walletType = localStorage.getItem('walletType');
  
  if (walletType === 'coinbase') {
    // Clear all wallet data
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletConnectedAt');
    
    // Dispatch disconnection event
    if (walletAddress) {
      window.dispatchEvent(new CustomEvent("walletChanged", {
        detail: {
          action: 'disconnected',
          walletType: 'coinbase',
          time: new Date().toISOString()
        }
      }));
    }
  }
  
  console.log("Coinbase Wallet disconnection completed");
};
