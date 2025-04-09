
import { toast } from "sonner";
import type { StacksProvider } from "../../types/stacks-wallet";

/**
 * Checks if Stacks wallet is installed
 */
export const isStacksWalletInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.StacksProvider;
};

/**
 * Get Stacks provider safely without trying to redefine it
 */
export const getStacksProvider = (): StacksProvider | null => {
  try {
    if (!isStacksWalletInstalled()) {
      console.log("Stacks wallet not detected");
      return null;
    }
    
    // Return the provider directly without attempting to modify it
    return window.StacksProvider || null;
  } catch (error) {
    console.error("Error accessing Stacks provider:", error);
    return null;
  }
};

/**
 * Connect to Stacks wallet safely
 */
export const connectStacksWallet = async (): Promise<string | null> => {
  try {
    const provider = getStacksProvider();
    
    if (!provider) {
      toast.error("Stacks wallet not found. Please install it first.");
      return null;
    }
    
    // Now using the connect method we added to the interface
    const address = await provider.connect();
    if (address) {
      console.log("Connected to Stacks wallet:", address);
      return address;
    }
    
    return null;
  } catch (error) {
    console.error("Error connecting to Stacks wallet:", error);
    toast.error(`Could not connect to Stacks wallet: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
};

/**
 * Disconnect from Stacks wallet
 */
export const disconnectStacksWallet = async (): Promise<void> => {
  try {
    const provider = getStacksProvider();
    
    if (provider && provider.disconnect) {
      await provider.disconnect();
      console.log("Disconnected from Stacks wallet");
    }
  } catch (error) {
    console.error("Error disconnecting from Stacks wallet:", error);
  }
};

/**
 * Get the current Stacks wallet address if connected
 */
export const getCurrentStacksAddress = async (): Promise<string | null> => {
  try {
    // For Stacks, we rely on the stored wallet address since there's
    // no standard way to check the current address across all implementations
    if (localStorage.getItem('walletType') === 'stacks') {
      return localStorage.getItem('walletAddress');
    }
    return null;
  } catch (error) {
    console.error("Error getting Stacks address:", error);
    return null;
  }
};
