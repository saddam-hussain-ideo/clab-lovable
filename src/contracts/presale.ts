
// This file re-exports the PurchaseForm component from its proper location
// It should not contain JSX directly as it's a .ts file, not .tsx

import { PurchaseForm } from "@/components/presale/PurchaseForm";
import { PresaleCountdown } from "@/components/presale/PresaleCountdown";
import { getEthPrice } from "@/utils/tokenCalculation";
import { fetchActivePresaleStage, getMinimumPurchaseAmount } from "@/utils/presale/purchaseHandlers";

export { PurchaseForm, PresaleCountdown, fetchActivePresaleStage, getMinimumPurchaseAmount };

// Export any specific types or interfaces needed for the presale functionality
export interface PresaleConfig {
  minPurchase: number;
  tokenPrice: number;
  tokenPriceUsd: number; // Add USD price for token
  tokenName: string;
  walletAddress: string | null;
}

// Network type - updated to match utils/wallet/index.ts
export type Network = 'mainnet' | 'testnet' | 'devnet' | 'mainnet-beta';
export type BlockchainNetwork = 'solana' | 'ethereum';
export type EthereumCurrency = 'ETH' | 'USDC' | 'USDT';

// Export utility functions for presale if needed
export const calculateTokenAmount = (solAmount: number, tokenPrice: number): number => {
  if (!solAmount || solAmount <= 0 || !tokenPrice || tokenPrice <= 0) {
    return 0;
  }
  return solAmount / tokenPrice;
};

// Calculate token amount for Ethereum currencies based on USD price
export const calculateEthTokenAmount = async (
  amount: number, 
  currency: EthereumCurrency, 
  tokenPriceUsd: number
): Promise<number> => {
  if (!amount || amount <= 0 || !tokenPriceUsd || tokenPriceUsd <= 0) {
    return 0;
  }
  
  // For stablecoins, the amount is already in USD
  if (currency === 'USDC' || currency === 'USDT') {
    return amount / tokenPriceUsd;
  }
  
  // For ETH, get current ETH price and convert to USD
  const ethToUsdRate = await getEthPrice();
  const usdAmount = amount * ethToUsdRate;
  return usdAmount / tokenPriceUsd;
};

export const formatCurrency = (amount: number, currency: string = "SOL", precision: number = 2): string => {
  return `${amount.toFixed(precision)} ${currency}`;
};

export const getMinimumPurchaseDisplay = (
  minPurchase: number, 
  solPrice: number, 
  currency: "SOL" | "USDC" | "USDT"
): string => {
  if (currency === "SOL") {
    return `${minPurchase} SOL`;
  } else {
    const usdValue = (minPurchase * solPrice).toFixed(2);
    return `${usdValue} ${currency}`;
  }
};

// Get the current stage information from supabase
export const getCurrentPresaleStageInfo = async (network: 'mainnet' | 'testnet') => {
  return await fetchActivePresaleStage(network);
};
