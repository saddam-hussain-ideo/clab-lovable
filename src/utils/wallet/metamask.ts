// Import the EthereumProvider type and helper functions as values, not types
import type { EthereumProvider } from "../../types/wallet-providers";
import { isCoinbaseProvider, isRealMetaMaskProvider } from "../../types/wallet-providers";
import { toast } from "sonner";
import { safelyAccessProperty } from "./safeAccess";

// Clear any cached wallet connections
export const clearCachedWalletConnections = (): void => {
  console.log("Clearing cached wallet connections");
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('walletType');
  localStorage.removeItem('walletConnectedAt');
  localStorage.removeItem('phantom_encryption_key');
  localStorage.removeItem('solflare_wallet');
  
  // Attempt to disconnect active providers if possible
  try {
    if (window.ethereum?.disconnect) {
      window.ethereum.disconnect();
    }
    
    if (window.phantom?.solana?.disconnect) {
      window.phantom.solana.disconnect();
    }
    
    // Note: Solflare doesn't have a disconnect method, so we'll just remove it from storage
    if (window.solflare) {
      localStorage.removeItem('solflare_wallet');
    }
  } catch (e) {
    console.warn("Error disconnecting existing providers:", e);
  }
};

// Temporary disable Coinbase Wallet injection - safer version that doesn't modify read-only properties
export const disableCoinbaseWalletInjection = (): (() => void) => {
  console.log("Attempting to disable Coinbase Wallet injection temporarily");
  
  // Store original ethereum reference
  const originalEthereum = window.ethereum;
  const hadCoinbaseWallet = !!(window as any).coinbaseWallet;
  const coinbaseWalletBackup = hadCoinbaseWallet ? { ...(window as any).coinbaseWallet } : null;
  
  // If we have multiple providers, create a filtered version
  let filteredProviders: any[] | null = null;
  let originalProviders: any[] | null = null;
  
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    // Make a safe copy of the providers array
    originalProviders = [...window.ethereum.providers];
    
    // Create a filtered version without modifying the original
    filteredProviders = originalProviders.filter(
      provider => !isCoinbaseProvider(provider)
    );
    
    console.log(`Identified ${originalProviders.length - filteredProviders.length} Coinbase providers to filter`);
  }
  
  // If there's a coinbaseWallet property on window, remove it temporarily
  if (hadCoinbaseWallet) {
    console.log("Temporarily removing window.coinbaseWallet");
    delete (window as any).coinbaseWallet;
  }
  
  // If we have multiple providers, we'll create a temporary ethereum object
  if (filteredProviders && filteredProviders.length > 0 && originalProviders) {
    try {
      // Create a proxy for ethereum that will return filtered providers
      const ethereumProxy = new Proxy(window.ethereum as object, {
        get(target: any, prop) {
          if (prop === 'providers') {
            return filteredProviders;
          }
          return target[prop];
        }
      });
      
      // Replace window.ethereum with our proxy only during the connection attempt
      (window as any).ethereum = ethereumProxy;
      
      console.log("Created ethereum proxy with filtered providers");
    } catch (e) {
      console.error("Failed to create ethereum proxy:", e);
    }
  }
  
  // Return a function that will restore the original state
  return () => {
    console.log("Restoring original ethereum state");
    
    // Restore original ethereum object
    if (originalEthereum) {
      (window as any).ethereum = originalEthereum;
    }
    
    // Restore coinbaseWallet property if it existed
    if (hadCoinbaseWallet && coinbaseWalletBackup) {
      (window as any).coinbaseWallet = coinbaseWalletBackup;
    }
    
    console.log("Original ethereum state restored");
  };
};

// Enhanced provider detection logic
export const getMetaMaskProvider = async (): Promise<EthereumProvider | null> => {
  console.group("MetaMask Provider Detection");
  
  try {
    // Wait for window.ethereum to be available
    let retries = 0;
    while (!window.ethereum && retries < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }

    if (!window.ethereum) {
      console.log("No ethereum provider found after retries");
      console.groupEnd();
      return null;
    }

    // Temporarily disable Coinbase Wallet injection
    const restoreState = disableCoinbaseWalletInjection();

    try {
      let provider: EthereumProvider | null = null;

      // If we have multiple providers, find MetaMask
      if (window.ethereum.providers?.length > 0) {
        provider = window.ethereum.providers.find(isRealMetaMaskProvider) || null;
        console.log("Found MetaMask in providers array:", !!provider);
      }
      // If no provider found in array, check if window.ethereum is MetaMask
      if (!provider && isRealMetaMaskProvider(window.ethereum)) {
        provider = window.ethereum;
        console.log("Found MetaMask as window.ethereum");
      }

      if (!provider) {
        console.log("No MetaMask provider found");
        return null;
      }

      // Ensure the provider has the required methods
      if (!provider.request || typeof provider.request !== 'function') {
        console.error("Invalid MetaMask provider: missing request method");
        return null;
      }

      // Test if the provider is responsive
      try {
        await provider.request({ method: 'eth_chainId' });
      } catch (error) {
        console.error("Provider not responsive:", error);
        return null;
      }

      console.log("Successfully detected MetaMask provider");
      return provider;
    } finally {
      // Always restore the original state
      restoreState();
    }
  } catch (error) {
    console.error("Error detecting MetaMask provider:", error);
    return null;
  } finally {
    console.groupEnd();
  }
};

// Check if Metamask is installed
export const isMetamaskInstalled = async (): Promise<boolean> => {
  return getMetaMaskProvider().then(provider => provider !== null);
};

// Connect to Metamask wallet with explicit provider selection
export const connectMetamask = async (): Promise<string | null> => {
  try {
    // Clear any existing wallet connections first
    clearCachedWalletConnections();
    
    const provider = await getMetaMaskProvider();
    
    if (!provider) {
      console.error("MetaMask provider not found");
      toast.error("MetaMask provider not found. Please install MetaMask or disable other wallet extensions.");
      return null;
    }
    
    // Check for Coinbase masquerading as MetaMask
    if (isCoinbaseProvider(provider)) {
      console.warn("Detected Coinbase Wallet masquerading as MetaMask");
      toast.error("Your Coinbase Wallet is detected instead of MetaMask. Please disable Coinbase extension or use it directly.");
      return null;
    }
    
    console.log("Requesting account access from MetaMask provider:", provider);

    // Try to get accounts directly first without wallet_requestPermissions
    // This avoids errors on some MetaMask versions/integrations that don't support wallet_requestPermissions
    try {
      // Request accounts directly - this should work on all providers
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts'
      });
      
      if (accounts && accounts.length > 0) {
        console.log(`Connected to MetaMask with address: ${accounts[0]}`);
        
        // Store wallet info in localStorage
        localStorage.setItem('walletAddress', accounts[0]);
        localStorage.setItem('walletType', 'metamask');
        localStorage.setItem('walletConnectedAt', Date.now().toString());
        
        // Explicitly fire wallet connection events
        window.dispatchEvent(new CustomEvent("walletChanged", {
          detail: { action: 'connected', wallet: accounts[0], walletType: 'metamask' }
        }));
        
        window.dispatchEvent(new CustomEvent("globalWalletConnected", {
          detail: { address: accounts[0], walletType: 'metamask' }
        }));
        
        return accounts[0];
      }
      
      console.error("No accounts returned from MetaMask");
      toast.error("No accounts returned from MetaMask. Please unlock your wallet and try again.");
      return null;
    } catch (error) {
      console.error("Error using simple eth_requestAccounts:", error);
      toast.error("Failed to connect to MetaMask. Please try again.");
      return null;
    }
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    toast.error("Failed to connect to MetaMask. Please try again.");
    return null;
  }
};

// Get current Metamask address
export const getCurrentMetamaskAddress = async (): Promise<string | null> => {
  try {
    const provider = await getMetaMaskProvider();
    
    if (!provider) {
      return null;
    }
    
    const accounts = await provider.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting MetaMask address:", error);
    return null;
  }
};

// Disconnect from Metamask
export const disconnectWallet = async (): Promise<void> => {
  console.log("Metamask disconnect called - clearing all wallet data");
  
  // First try to dispatch disconnection event before clearing localStorage
  const walletAddress = localStorage.getItem('walletAddress');
  const walletType = localStorage.getItem('walletType');
  
  // Clear all cached wallet data
  clearCachedWalletConnections();
  
  // Additional cleanup for any session or temporary data
  sessionStorage.removeItem(`wallet_synced_${walletAddress}`);
  
  // Dispatch disconnection event if we had a connected wallet
  if (walletAddress) {
    window.dispatchEvent(new CustomEvent("walletChanged", {
      detail: {
        action: 'disconnected',
        walletType: walletType || 'metamask',
        time: new Date().toISOString()
      }
    }));
  }
  
  console.log("Wallet disconnection completed");
};

// Alias for backward compatibility
export const disconnectMetamask = disconnectWallet;

// Get current Ethereum network
export const getEthereumNetwork = async (): Promise<string | null> => {
  try {
    const provider = await getMetaMaskProvider();
    
    if (!provider) {
      return null;
    }
    
    const chainId = await provider.request({ method: 'eth_chainId' });
    switch (chainId) {
      case '0x1':
        return 'mainnet';
      case '0x3':
        return 'ropsten';
      case '0x4':
        return 'rinkeby';
      case '0x5':
        return 'goerli';
      case '0x2a':
        return 'kovan';
      default:
        return `unknown-${chainId}`;
    }
  } catch (error) {
    console.error("Error getting Ethereum network:", error);
    return null;
  }
};

// Setup MetaMask event listeners
export const setupMetamaskListeners = (
  onAccountChange: (address: string | null) => void,
  onNetworkChange: (networkId: string) => void
) => {
  if (!isMetamaskInstalled()) return;
  
  // Get provider reference for event listeners
  getMetaMaskProvider().then(provider => {
    if (!provider) return;
    
    // Handler for account changes
    const accountsChangedHandler = (accounts: string[]) => {
      console.log("Metamask accounts changed:", accounts);
      const address = accounts && accounts.length > 0 ? accounts[0] : null;
      
      // Update local storage with the new address
      if (address && localStorage.getItem('walletType') === 'metamask') {
        const oldAddress = localStorage.getItem('walletAddress');
        
        if (oldAddress !== address) {
          console.log(`Wallet address changed from ${oldAddress} to ${address}`);
          localStorage.setItem('walletAddress', address);
          
          // Dispatch a wallet changed event to update the UI
          window.dispatchEvent(new CustomEvent("walletChanged", {
            detail: { action: 'connected', wallet: address, walletType: 'metamask' }
          }));
          
          window.dispatchEvent(new CustomEvent("globalWalletConnected", {
            detail: { address, walletType: 'metamask', network: localStorage.getItem('activeNetwork') || 'testnet' }
          }));
        }
      } else if (!address && localStorage.getItem('walletType') === 'metamask') {
        // If accounts array is empty, user has locked their MetaMask or disconnected
        console.log("MetaMask appears to be locked or disconnected");
        clearCachedWalletConnections();
        
        window.dispatchEvent(new CustomEvent("walletChanged", {
          detail: { action: 'disconnected', walletType: 'metamask' }
        }));
      }
      
      onAccountChange(address);
    };
    
    // Handler for chain (network) changes
    const chainChangedHandler = (chainId: string) => {
      console.log("Metamask network changed:", chainId);
      onNetworkChange(chainId);
    };
    
    // Add event listeners
    provider.on('accountsChanged', accountsChangedHandler);
    provider.on('chainChanged', chainChangedHandler);
    
    // Return a cleanup function that removes the listeners
    return () => {
      provider.removeListener('accountsChanged', accountsChangedHandler);
      provider.removeListener('chainChanged', chainChangedHandler);
    };
  });
};

// Check if connected to the right network
export const checkEthereumNetwork = async (
  required: 'mainnet' | 'testnet'
): Promise<boolean> => {
  try {
    const provider = await getMetaMaskProvider();
    if (!provider) return false;
    
    const chainId = await provider.request({ method: 'eth_chainId' });
    
    // For testnet, we'll accept any test network
    if (required === 'testnet') {
      return chainId === '0x5' || chainId === '0x4' || chainId === '0x3' || chainId === '0xaa36a7'; // Goerli, Rinkeby, Ropsten, or Sepolia
    }
    
    // For mainnet, only accept Ethereum mainnet
    return chainId === '0x1';
  } catch (error) {
    console.error("Error checking Ethereum network:", error);
    return false;
  }
};

// Switch to the correct network
export const switchEthereumNetwork = async (
  target: 'mainnet' | 'testnet'
): Promise<boolean> => {
  try {
    const provider = await getMetaMaskProvider();
    if (!provider) return false;
    
    const chainId = target === 'mainnet' ? '0x1' : '0x5'; // Mainnet or Goerli
    
    try {
      // Try to switch to the network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      return true;
    } catch (switchError: any) {
      // If the chain hasn't been added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          const params = target === 'mainnet' 
            ? [{ 
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://eth-mainnet.public.blastapi.io'],
                blockExplorerUrls: ['https://etherscan.io'],
              }]
            : [{ 
                chainId: '0x5',
                chainName: 'Goerli Testnet',
                nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://goerli.infura.io/v3/'],
                blockExplorerUrls: ['https://goerli.etherscan.io'],
              }];
          
          await provider.request({
            method: 'wallet_addEthereumChain',
            params,
          });
          return true;
        } catch (addError) {
          console.error("Error adding Ethereum chain:", addError);
          return false;
        }
      }
      console.error("Error switching Ethereum chain:", switchError);
      return false;
    }
  } catch (error) {
    console.error("Error in switchEthereumNetwork:", error);
    return false;
  }
};
