import { useState, useEffect } from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { WalletType } from '@/services/wallet/walletService';
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';

export function useWalletConnect() {
  const [isConnecting, setIsConnecting] = useState<WalletType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  // Check for available wallets
  const [detectedWallets, setDetectedWallets] = useState<WalletType[]>([]);
  
  useEffect(() => {
    const detectWallets = async () => {
      try {
        // Check for Ethereum wallets
        const hasEthereum = !!(window as any).ethereum;
        const hasMetaMask = hasEthereum && (window as any).ethereum.isMetaMask;
        const hasPhantomEth = hasEthereum && (window as any).ethereum.isPhantom;
        
        // Check for Solana wallets
        const hasSolana = !!(window as any).solana;
        const hasPhantom = hasSolana || !!(window as any).phantom?.solana;
        const hasSolflare = !!(window as any).solflare;
        
        const detected: WalletType[] = [];
        if (hasMetaMask) detected.push('metamask');
        if (hasPhantomEth) detected.push('phantom_ethereum');
        if (hasPhantom) detected.push('phantom');
        if (hasSolflare) detected.push('solflare');
        
        setDetectedWallets(detected);
        logDebug('WALLET', `Detected wallets: ${detected.join(', ')}`);
      } catch (err) {
        console.error('Error detecting wallets:', err);
      }
    };
    
    detectWallets();
  }, []);

  const connectWallet = async (type: WalletType) => {
    try {
      setIsConnecting(type);
      setError(null);
      
      // For Ethereum wallets
      if (type === 'metamask' || type === 'phantom_ethereum') {
        try {
          await connect({ 
            connector: injected(),
          });
          
          // Wait a moment for the connection to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if we're connected after the attempt
          if (isConnected && address) {
            toast.success(`Connected to ${type} wallet`);
            return { connected: true, address, type };
          } else {
            throw new Error(`Failed to connect to ${type}`);
          }
        } catch (error: any) {
          console.error(`Error connecting to ${type}:`, error);
          toast.error(error.message || `Failed to connect to ${type}`);
          throw error;
        }
      } 
      // For WalletConnect
      else if (type === 'walletconnect') {
        try {
          await connect({ 
            connector: walletConnect({
              projectId: '6c52f34647d6b0874e74b1523f918842',
              showQrModal: true,
              metadata: {
                name: 'CLAB',
                description: 'CLAB Web Application',
                url: window.location.origin,
                icons: [`${window.location.origin}/favicon.ico`]
              }
            }),
          });
          
          // Wait a moment for the connection to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if we're connected after the attempt
          if (isConnected && address) {
            toast.success(`Connected with WalletConnect`);
            return { connected: true, address, type };
          } else {
            throw new Error(`Failed to connect with WalletConnect`);
          }
        } catch (error: any) {
          console.error(`Error connecting with WalletConnect:`, error);
          toast.error(error.message || `Failed to connect with WalletConnect`);
          throw error;
        }
      }
      // For Solana wallets
      else if (type === 'phantom' || type === 'solflare') {
        try {
          // Check if the wallet is available
          let provider;
          
          if (type === 'phantom') {
            provider = (window as any).phantom?.solana || (window as any).solana;
          } else if (type === 'solflare') {
            provider = (window as any).solflare;
          }
          
          if (!provider) {
            throw new Error(`${type} wallet not installed`);
          }
          
          // Connect to the wallet
          const resp = await provider.connect();
          const walletAddress = resp.publicKey.toString();
          
          toast.success(`Connected to ${type} wallet`);
          return { connected: true, address: walletAddress, type };
        } catch (error: any) {
          console.error(`Error connecting to ${type}:`, error);
          toast.error(error.message || `Failed to connect to ${type}`);
          throw error;
        }
      }
      
      throw new Error(`Unsupported wallet type: ${type}`);
    } catch (err: any) {
      console.error(`Error connecting to ${type}:`, err);
      setError(err.message || `Failed to connect to ${type}`);
      return { connected: false, address: null, type: null };
    } finally {
      setIsConnecting(null);
    }
  };

  const disconnectWallet = async () => {
    try {
      // For Ethereum wallets
      if (isConnected) {
        disconnect();
      }
      
      // For Solana wallets
      if ((window as any).solana && (window as any).solana.isConnected) {
        await (window as any).solana.disconnect();
      }
      
      if ((window as any).phantom?.solana && (window as any).phantom.solana.isConnected) {
        await (window as any).phantom.solana.disconnect();
      }
      
      if ((window as any).solflare && (window as any).solflare.isConnected) {
        await (window as any).solflare.disconnect();
      }
      
      toast.success('Wallet disconnected');
      return true;
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      return false;
    }
  };

  const isWalletDetected = (type: WalletType) => detectedWallets.includes(type);

  return {
    connectWallet,
    disconnectWallet,
    isConnecting,
    error,
    address,
    isConnected,
    isWalletDetected,
    detectedWallets
  };
}
