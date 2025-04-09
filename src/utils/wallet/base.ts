
import type { EthereumProvider } from "../../types/wallet-providers";
import { toast } from "sonner";
import { getMetaMaskProvider } from "./metamask";

// Base chain ID
const BASE_MAINNET_CHAIN_ID = "0x2105"; // 8453 in decimal
const BASE_TESTNET_CHAIN_ID = "0x14a33"; // 84531 in decimal

/**
 * Checks if Base network is supported in the current wallet
 */
export const isBaseSupported = async (): Promise<boolean> => {
  try {
    const provider = getMetaMaskProvider();
    if (!provider) return false;
    
    // Get list of chains supported by the wallet
    const chains = await provider.request({ 
      method: 'wallet_getPermissions'
    });
    
    return true; // If we got here, basic Ethereum functionality is available
  } catch (error) {
    console.error("Error checking Base support:", error);
    return false;
  }
};

/**
 * Requests a switch to the Base network
 * @param isTestnet Whether to use testnet or mainnet
 * @returns True if successful, false otherwise
 */
export const switchToBaseNetwork = async (isTestnet: boolean = false): Promise<boolean> => {
  try {
    const provider = getMetaMaskProvider();
    if (!provider) {
      toast.error("No Ethereum wallet found");
      return false;
    }
    
    const chainId = isTestnet ? BASE_TESTNET_CHAIN_ID : BASE_MAINNET_CHAIN_ID;
    
    try {
      // Try to switch to the Base chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId,
                chainName: isTestnet ? 'Base Goerli Testnet' : 'Base Mainnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: isTestnet 
                  ? ['https://goerli.base.org'] 
                  : ['https://mainnet.base.org'],
                blockExplorerUrls: isTestnet 
                  ? ['https://goerli.basescan.org'] 
                  : ['https://basescan.org'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Base network:", addError);
          toast.error("Could not add Base network to your wallet");
          return false;
        }
      }
      console.error("Error switching to Base network:", switchError);
      toast.error("Could not switch to Base network");
      return false;
    }
  } catch (error) {
    console.error("Error switching to Base network:", error);
    toast.error("Network switch failed");
    return false;
  }
};

/**
 * Connect to Base wallet (via Metamask, Coinbase Wallet or other Ethereum provider)
 * @returns The wallet address or null if connection failed
 */
export const connectBaseWallet = async (isTestnet: boolean = false): Promise<string | null> => {
  try {
    // Clear any stale connection data first
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletConnectedAt');

    // Use our dedicated provider getter to ensure we get the correct MetaMask instance
    const provider = getMetaMaskProvider();
    if (!provider) {
      toast.error("MetaMask not detected. Please install MetaMask extension");
      window.open("https://metamask.io/download/", "_blank");
      return null;
    }

    // Switch to Base network
    const switched = await switchToBaseNetwork(isTestnet);
    if (!switched) {
      toast.error("Please connect to Base network to continue");
      return null;
    }

    // Request account access
    console.log("Requesting accounts from MetaMask provider...");
    try {
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        toast.error("No accounts found. Please check your wallet and try again");
        return null;
      }

      const address = accounts[0];
      console.log("Connected to Base wallet:", address);
      
      // Setup event listeners for wallet changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          console.log("Base wallet disconnected");
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('walletType');
          localStorage.removeItem('walletConnectedAt');
          
          window.dispatchEvent(new CustomEvent("walletChanged", {
            detail: { action: 'disconnected' }
          }));
        } else {
          console.log("Base wallet account changed:", accounts[0]);
          
          // Update localStorage with new address
          localStorage.setItem('walletAddress', accounts[0]);
          localStorage.setItem('walletConnectedAt', Date.now().toString());
          
          window.dispatchEvent(new CustomEvent("walletChanged", {
            detail: { action: 'connected', wallet: accounts[0], walletType: 'metamask' }
          }));
        }
      };
      
      const handleChainChanged = (chainId: string) => {
        if (chainId !== (isTestnet ? BASE_TESTNET_CHAIN_ID : BASE_MAINNET_CHAIN_ID)) {
          console.log("Chain changed to non-Base network:", chainId);
          toast.warning("Please switch back to Base network for full functionality");
        }
      };
      
      // Remove existing listeners to avoid duplicates
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
      
      // Add listeners
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      
      // Store the wallet address in localStorage with a timestamp
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletType', 'metamask');
      localStorage.setItem('walletConnectedAt', Date.now().toString());
      
      // Explicitly fire a global event for UI components to catch
      console.log("Dispatching wallet connection events");
      
      // Dispatch events with a slight delay to ensure they're not missed
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("walletChanged", {
          detail: { action: 'connected', wallet: address, walletType: 'metamask' }
        }));
        
        window.dispatchEvent(new CustomEvent("globalWalletConnected", {
          detail: { address, walletType: 'metamask', network: isTestnet ? 'testnet' : 'mainnet' }
        }));
      }, 50);
      
      return address;
    } catch (requestError) {
      console.error("Error requesting accounts:", requestError);
      toast.error("Failed to connect. Please check if MetaMask is unlocked");
      return null;
    }
  } catch (error) {
    console.error("Error connecting to Base wallet:", error);
    toast.error(`Could not connect to Base: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
};

/**
 * Disconnect from Base wallet
 */
export const disconnectBaseWallet = async (): Promise<void> => {
  console.log("Base wallet disconnect called - clearing local storage");
  
  // Remove event listeners
  const provider = getMetaMaskProvider();
  if (provider) {
    provider.removeListener('accountsChanged', () => {});
    provider.removeListener('chainChanged', () => {});
  }
  
  // Clear wallet data from localStorage
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('walletType');
  localStorage.removeItem('walletConnectedAt');
  
  // Dispatch disconnection event
  window.dispatchEvent(new CustomEvent("walletChanged", {
    detail: { action: 'disconnected' }
  }));
  
  // Force refresh wallet connection UI
  setTimeout(() => {
    window.dispatchEvent(new Event('storage'));
  }, 100);
};

/**
 * Get the current Base wallet address if connected
 * @returns The wallet address or null if not connected
 */
export const getCurrentBaseAddress = async (): Promise<string | null> => {
  try {
    // Get the provider specifically
    const provider = getMetaMaskProvider();
    if (!provider) {
      console.log("No MetaMask provider found when checking current Base address");
      return null;
    }
    
    const accounts = await provider.request({ 
      method: 'eth_accounts' 
    });
    
    if (!accounts || accounts.length === 0) return null;
    return accounts[0];
  } catch (error) {
    console.error("Error getting Base address:", error);
    return null;
  }
};

/**
 * Check if currently on Base network
 */
export const isOnBaseNetwork = async (isTestnet: boolean = false): Promise<boolean> => {
  try {
    const provider = getMetaMaskProvider();
    if (!provider) return false;
    
    const chainId = await provider.request({ 
      method: 'eth_chainId' 
    });
    
    return chainId === (isTestnet ? BASE_TESTNET_CHAIN_ID : BASE_MAINNET_CHAIN_ID);
  } catch (error) {
    console.error("Error checking Base network:", error);
    return false;
  }
};
