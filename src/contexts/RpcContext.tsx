
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type BlockchainType = 'solana' | 'ethereum';
type NetworkType = 'mainnet' | 'testnet';

interface RpcContextType {
  preferredBlockchain: BlockchainType;
  setPreferredBlockchain: (blockchain: BlockchainType) => void;
  activeNetwork: NetworkType;
  setActiveNetwork: (network: NetworkType) => void;
  detectBlockchainFromRpc: (rpcUrl: string) => BlockchainType;
  getBlockchainForTab: (tabId: string) => BlockchainType;
}

const RpcContext = createContext<RpcContextType | undefined>(undefined);

export const RpcProvider = ({ children }: { children: ReactNode }) => {
  const [preferredBlockchain, setPreferredBlockchain] = useState<BlockchainType>(() => {
    try {
      // Try to get from localStorage first
      const stored = localStorage.getItem('preferredBlockchain');
      if (stored === 'solana' || stored === 'ethereum') {
        return stored;
      }
      // Fall back to detection from wallet
      return detectBlockchainFromWallet();
    } catch (error) {
      console.error("Error initializing preferred blockchain:", error);
      return 'solana'; // Safe fallback
    }
  });
  
  const [activeNetwork, setActiveNetwork] = useState<NetworkType>(() => {
    try {
      return localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet' : 'testnet';
    } catch (error) {
      console.error("Error initializing active network:", error);
      return 'testnet'; // Safe fallback
    }
  });

  // Store preferred blockchain whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('preferredBlockchain', preferredBlockchain);
    } catch (error) {
      console.error("Error storing preferred blockchain:", error);
    }
  }, [preferredBlockchain]);

  // Store active network whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('activeNetwork', activeNetwork);
      // Dispatch an event to notify components of the network change
      window.dispatchEvent(new CustomEvent('networkChanged', {
        detail: { network: activeNetwork }
      }));
    } catch (error) {
      console.error("Error storing active network:", error);
    }
  }, [activeNetwork]);

  const detectBlockchainFromWallet = (): BlockchainType => {
    try {
      const walletType = localStorage.getItem('walletType');
      if (walletType === 'metamask' || walletType === 'phantom_ethereum') {
        return 'ethereum';
      }
      return 'solana';
    } catch (error) {
      console.error("Error detecting blockchain from wallet:", error);
      return 'solana'; // Safe fallback
    }
  };

  const detectBlockchainFromRpc = (rpcUrl: string): BlockchainType => {
    if (!rpcUrl) return preferredBlockchain;
    
    try {
      // Common Solana RPC patterns
      const solanaPatterns = [
        'solana',
        'genesysgo',
        'mainnet-beta',
        'devnet',
        'quicknode.solana',
        'helius'
      ];
      
      // Common Ethereum RPC patterns
      const ethereumPatterns = [
        'ethereum',
        'eth',
        'sepolia',
        'goerli',
        'infura.io',
        'alchemy.com/eth'
      ];
      
      // Check for Solana patterns
      for (const pattern of solanaPatterns) {
        if (rpcUrl.toLowerCase().includes(pattern)) {
          return 'solana';
        }
      }
      
      // Check for Ethereum patterns
      for (const pattern of ethereumPatterns) {
        if (rpcUrl.toLowerCase().includes(pattern)) {
          return 'ethereum';
        }
      }
      
      // If no pattern matched, return current preference
      return preferredBlockchain;
    } catch (error) {
      console.error("Error detecting blockchain from RPC URL:", error);
      return preferredBlockchain; // Safe fallback
    }
  };

  const getBlockchainForTab = (tabId: string): BlockchainType => {
    if (tabId === 'solana') return 'solana';
    if (tabId === 'ethereum') return 'ethereum';
    return preferredBlockchain;
  };

  return (
    <RpcContext.Provider 
      value={{ 
        preferredBlockchain, 
        setPreferredBlockchain,
        activeNetwork,
        setActiveNetwork,
        detectBlockchainFromRpc,
        getBlockchainForTab
      }}
    >
      {children}
    </RpcContext.Provider>
  );
};

export const useRpc = () => {
  const context = useContext(RpcContext);
  if (context === undefined) {
    console.error("useRpc must be used within a RpcProvider");
    // Return a default value instead of throwing an error to prevent rendering failures
    return {
      preferredBlockchain: 'solana' as BlockchainType,
      setPreferredBlockchain: () => {},
      activeNetwork: 'testnet' as NetworkType,
      setActiveNetwork: () => {},
      detectBlockchainFromRpc: () => 'solana' as BlockchainType,
      getBlockchainForTab: () => 'solana' as BlockchainType
    };
  }
  return context;
};

// Export a hook to get the blockchain type with context awareness
export const useBlockchainType = (tabId?: string, rpcUrl?: string): BlockchainType => {
  try {
    const { preferredBlockchain, detectBlockchainFromRpc, getBlockchainForTab } = useRpc();
    
    // First check tab ID if provided
    if (tabId) {
      return getBlockchainForTab(tabId);
    }
    
    // Then check RPC URL if provided
    if (rpcUrl) {
      return detectBlockchainFromRpc(rpcUrl);
    }
    
    // Fallback to preferred blockchain
    return preferredBlockchain;
  } catch (error) {
    console.error("Error in useBlockchainType:", error);
    return 'solana'; // Safe fallback
  }
};
