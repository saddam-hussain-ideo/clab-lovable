
import { supabase } from "@/integrations/supabase/client";

export interface PurchaseData {
  id: number;
  wallet_address: string;
  wallet_type?: string;
  sol_amount?: number;
  token_amount: number;
  tx_hash: string;
  status: string;
  created_at: string;
  currency?: string;
  original_amount?: number;
  network?: string;
  presale_stages?: {
    name: string;
    token_price: number;
  }
}

/**
 * Fetches all purchases for a wallet address across all wallet types and networks
 */
export const fetchAllWalletPurchases = async (
  walletAddress: string,
  walletType: string | null = null,
  page: number = 1,
  itemsPerPage: number = 10,
  network: string = 'mainnet', // This parameter now controls filtering, not the query
  consolidatedView: boolean = false
): Promise<{ data: PurchaseData[], totalCount: number }> => {
  if (!walletAddress) {
    return { data: [], totalCount: 0 };
  }

  try {
    // Normalize wallet address to lowercase for case-insensitive comparison
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const isEthereum = isEthereumAddress(normalizedWalletAddress);
    
    console.log(`Fetching purchases for wallet: ${walletAddress} (normalized: ${normalizedWalletAddress}), type: ${walletType || 'all'}, network: ${consolidatedView ? 'both' : network}, isEthereum: ${isEthereum}`);
    
    // Get the total count first
    let countQuery = supabase.from("presale_contributions").select("*", {
      count: 'exact',
      head: true
    });
    
    // Use case-insensitive comparison for wallet address
    countQuery = countQuery.filter("wallet_address", "ilike", normalizedWalletAddress);
    
    // Filter by network, unless consolidated view is enabled
    if (!consolidatedView) {
      countQuery = countQuery.eq("network", network);
    }
    
    // Handle wallet type filtering
    if (walletType) {
      if (isEthereum && (walletType === 'phantom_ethereum' || walletType === 'metamask')) {
        // Group Ethereum wallet types together for Ethereum addresses
        countQuery = countQuery.in("wallet_type", ['phantom_ethereum', 'metamask']);
      } else {
        countQuery = countQuery.eq("wallet_type", walletType);
      }
    } else if (isEthereum) {
      // For Ethereum addresses without wallet type, include both Ethereum wallet types
      countQuery = countQuery.in("wallet_type", ['phantom_ethereum', 'metamask']);
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      throw countError;
    }
    
    // Fetch the actual purchases with pagination
    let query = supabase
      .from("presale_contributions")
      .select("*, presale_stages(name, token_price)")
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);
    
    // Use case-insensitive comparison for wallet address
    query = query.filter("wallet_address", "ilike", normalizedWalletAddress);
    
    // Filter by network, unless consolidated view is enabled
    if (!consolidatedView) {
      query = query.eq("network", network);
    }
    
    // Handle wallet type filtering
    if (walletType) {
      if (isEthereum && (walletType === 'phantom_ethereum' || walletType === 'metamask')) {
        // Group Ethereum wallet types together for Ethereum addresses
        query = query.in("wallet_type", ['phantom_ethereum', 'metamask']);
      } else {
        query = query.eq("wallet_type", walletType);
      }
    } else if (isEthereum) {
      // For Ethereum addresses without wallet type, include both Ethereum wallet types
      query = query.in("wallet_type", ['phantom_ethereum', 'metamask']);
    }
    
    const { data, error } = await query.order("created_at", {
      ascending: false
    });
    
    if (error) {
      throw error;
    }
    
    return { 
      data: data || [], 
      totalCount: count || 0 
    };
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw error;
  }
};

/**
 * Fetches the total purchase amount for a wallet across all networks
 */
export const fetchTotalPurchaseAmount = async (
  walletAddress: string,
  walletType: string | null = null,
  network: string = 'mainnet', // This parameter now controls filtering, not the query
  consolidatedView: boolean = false
): Promise<number> => {
  if (!walletAddress) {
    return 0;
  }

  try {
    // Normalize wallet address to lowercase for case-insensitive comparison
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const isEthereum = isEthereumAddress(normalizedWalletAddress);
    
    console.log(`Fetching total purchases for ${walletAddress} (normalized: ${normalizedWalletAddress}) with type ${walletType || 'all'}, network: ${consolidatedView ? 'both' : network}, isEthereum: ${isEthereum}`);
    
    let query = supabase
      .from("presale_contributions")
      .select("token_amount");
    
    // Use case-insensitive comparison for wallet address
    query = query.filter('wallet_address', 'ilike', normalizedWalletAddress);
    
    // Filter by network, unless consolidated view is enabled
    if (!consolidatedView) {
      query = query.eq("network", network);
    }
    
    // Handle wallet type filtering
    if (walletType) {
      if (isEthereum && (walletType === 'phantom_ethereum' || walletType === 'metamask')) {
        // Group Ethereum wallet types together for Ethereum addresses
        query = query.in("wallet_type", ['phantom_ethereum', 'metamask']);
      } else {
        query = query.eq("wallet_type", walletType);
      }
    } else if (isEthereum) {
      // For Ethereum addresses without wallet type, include both Ethereum wallet types
      query = query.in("wallet_type", ['phantom_ethereum', 'metamask']);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Calculate sum of token_amount
    const total = data?.length 
      ? data.reduce((sum, item) => sum + Number(item.token_amount), 0)
      : 0;
    
    return total;
  } catch (error) {
    console.error("Error fetching total purchase:", error);
    return 0;
  }
};

/**
 * Utility function to detect if an address is likely an Ethereum address
 */
export const isEthereumAddress = (address: string): boolean => {
  // Basic check for Ethereum address format (0x followed by 40 hex characters)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Utility function to detect wallet type from address format
 */
export const detectWalletTypeFromAddress = (address: string): string | null => {
  if (isEthereumAddress(address)) {
    return 'ethereum'; // Generic Ethereum wallet type
  }
  
  // For Solana addresses (base58 encoded, typically 32-44 chars without prefix)
  if (/^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(address)) {
    return 'solana';
  }
  
  return null; // Unknown wallet type
};
