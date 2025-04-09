
import { toast } from "sonner";
import { Coin98Provider } from "@/types/wallet-providers";

export const isCoin98Available = (): boolean => {
  return typeof window !== 'undefined' && 
         window.coin98 !== undefined;
};

export const connectCoin98Wallet = async (): Promise<string | null> => {
  try {
    if (!isCoin98Available()) {
      toast.error("Coin98 wallet is not installed");
      window.open("https://coin98.com/wallet", "_blank");
      return null;
    }
    
    const provider = (window as any).coin98 as Coin98Provider;
    
    const result = await provider.connect();
    if (!result || !result.publicKey) {
      toast.error("Failed to connect to Coin98 wallet");
      return null;
    }
    
    const address = result.publicKey.toString();
    
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletType', 'coin98');
    localStorage.setItem('walletConnectedAt', Date.now().toString());
    
    window.dispatchEvent(new CustomEvent('walletChanged', {
      detail: {
        action: 'connected',
        wallet: address,
        type: 'coin98',
      }
    }));
    
    return address;
  } catch (error: any) {
    console.error("Error connecting to Coin98 wallet:", error);
    
    const errorMessage = error.code === 4001
      ? "Connection rejected by user"
      : error.message || "Failed to connect to Coin98 wallet";
    
    toast.error(errorMessage);
    return null;
  }
};

export const disconnectCoin98Wallet = async (): Promise<boolean> => {
  try {
    if (!isCoin98Available()) {
      return false;
    }
    
    const provider = (window as any).coin98 as Coin98Provider;
    await provider.disconnect();
    
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletConnectedAt');
    
    window.dispatchEvent(new CustomEvent('walletChanged', {
      detail: {
        action: 'disconnected'
      }
    }));
    
    return true;
  } catch (error) {
    console.error("Error disconnecting from Coin98 wallet:", error);
    return false;
  }
};

export const getCurrentCoin98Address = async (): Promise<string | null> => {
  try {
    if (!isCoin98Available()) {
      return null;
    }
    
    const provider = (window as any).coin98 as Coin98Provider;
    
    if (provider.publicKey) {
      return provider.publicKey.toString();
    }
    
    return null;
  } catch (error) {
    console.error("Error getting Coin98 address:", error);
    return null;
  }
};
