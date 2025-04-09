
import { supabase } from "@/lib/supabase";

// Find contribution by wallet address
export const findContributionByWalletAddress = async (walletAddress: string) => {
  try {
    const { data, error } = await supabase
      .from('presale_contributions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error finding contribution:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in findContributionByWalletAddress:', error);
    return null;
  }
};

// Update contribution status
export const updateContributionStatus = async (contributionId: number, status: string, txHash?: string) => {
  try {
    const updateData: any = { status };
    if (txHash) {
      updateData.tx_hash = txHash;
    }
    
    const { error } = await supabase
      .from('presale_contributions')
      .update(updateData)
      .eq('id', contributionId);
      
    if (error) {
      console.error('Error updating contribution status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateContributionStatus:', error);
    return false;
  }
};

// New function to fetch DEFI card settings
export const fetchDefiCardSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('defi_card_settings')
      .select('*')
      .eq('id', 1)
      .single();
      
    if (error) {
      console.error('Error fetching DEFI card settings:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchDefiCardSettings:', error);
    return null;
  }
};

// Check if wallet has registered for DEFI card
export const checkWalletDefiCardRegistration = async (walletAddress: string) => {
  try {
    const { data, error } = await supabase
      .from('defi_card_registrations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking DEFI card registration:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in checkWalletDefiCardRegistration:', error);
    return null;
  }
};
