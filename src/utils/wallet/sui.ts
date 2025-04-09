
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const connectSuiWallet = async (): Promise<string | null> => {
  try {
    // Check if Sui wallet is available
    const provider = window.suiWallet;
    
    if (!provider) {
      toast({
        title: "Sui Wallet Not Found",
        description: "Please install Sui wallet to connect",
        variant: "destructive"
      });
      window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank');
      return null;
    }

    console.log("Attempting to connect to Sui wallet...");
    
    // Connect to the wallet
    await provider.requestPermissions();
    const accounts = await provider.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      throw new Error("Failed to get accounts from Sui wallet");
    }
    
    const address = accounts[0];
    console.log("Connected to Sui with address:", address);
    
    // Store wallet info in localStorage
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletType', 'sui');
    
    // Dispatch event for components to update
    window.dispatchEvent(new Event('walletChanged'));
    
    return address;
  } catch (error: any) {
    console.error('Error connecting Sui wallet:', error);
    toast({
      title: "Connection Failed",
      description: error.message || "Failed to connect Sui wallet",
      variant: "destructive"
    });
    return null;
  }
};

export const disconnectSuiWallet = async (): Promise<void> => {
  try {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    
    // Dispatch event for components to update
    window.dispatchEvent(new Event('walletChanged'));
    
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from Sui wallet",
    });
  } catch (error: any) {
    console.error('Error disconnecting Sui wallet:', error);
    toast({
      title: "Disconnection Failed",
      description: error.message || "Failed to disconnect Sui wallet",
      variant: "destructive"
    });
  }
};

export const getCurrentSuiAddress = async (): Promise<string | null> => {
  try {
    const provider = window.suiWallet;
    if (provider) {
      const accounts = await provider.getAccounts();
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting Sui address:', error);
    return null;
  }
};
