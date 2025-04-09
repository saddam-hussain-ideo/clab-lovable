import { logDebug } from '@/utils/debugLogging';
import { supabase } from '@/lib/supabase';

export interface WalletProfile {
  id: string;
  wallet_address: string;
  wallet_type: string;
  first_connected_at: string;
  last_connected_at: string;
  display_name?: string;
  is_blocked?: boolean;
  username?: string;
  avatar_url?: string | null;
  points?: number;
}

/**
 * Service for user profiles related to wallet connections
 */
export const walletService = {
  /**
   * Log a wallet connection to the database
   */
  async logConnection(walletAddress: string, walletType: string): Promise<boolean> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      // First check if wallet exists in the database
      const { data: existingWallet } = await supabase
        .from('user_wallets')
        .select('id, wallet_address, last_connected_at')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      
      // If wallet exists, update last connected timestamp
      if (existingWallet) {
        logDebug('WALLET_SERVICE', `Updating existing wallet: ${normalizedAddress}`);
        
        await supabase
          .from('user_wallets')
          .update({
            last_connected_at: new Date().toISOString(),
            wallet_type: walletType // Update wallet type in case it changed
          })
          .eq('wallet_address', normalizedAddress);
          
        return true;
      }
      
      // If wallet doesn't exist, create a new record
      logDebug('WALLET_SERVICE', `Creating new wallet record: ${normalizedAddress}`);
      
      const { error } = await supabase
        .from('user_wallets')
        .insert({
          wallet_address: normalizedAddress,
          wallet_type: walletType,
          first_connected_at: new Date().toISOString(),
          last_connected_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating wallet record:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error logging wallet connection:', err);
      return false;
    }
  },
  
  /**
   * Ensure a wallet profile exists for the given address
   */
  async ensureWalletProfile(walletAddress: string, walletType: string): Promise<WalletProfile | null> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Check if a profile exists
      const { data: existingProfile } = await supabase
        .from('wallet_profiles')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      
      // If profile exists, return it
      if (existingProfile) {
        logDebug('WALLET_SERVICE', `Found existing wallet profile: ${normalizedAddress}`);
        return existingProfile as WalletProfile;
      }
      
      // If no profile exists, create one
      logDebug('WALLET_SERVICE', `Creating new wallet profile: ${normalizedAddress}`);
      
      const { data: newProfile, error } = await supabase
        .from('wallet_profiles')
        .insert({
          wallet_address: normalizedAddress,
          wallet_type: walletType,
          first_connected_at: new Date().toISOString(),
          last_connected_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();
      
      if (error) {
        console.error('Error creating wallet profile:', error);
        return null;
      }
      
      return newProfile as WalletProfile;
    } catch (err) {
      console.error('Error ensuring wallet profile:', err);
      return null;
    }
  },
  
  /**
   * Get wallet profile for a given address
   */
  async getWalletProfile(walletAddress: string): Promise<WalletProfile | null> {
    try {
      if (!walletAddress) return null;
      
      const normalizedAddress = walletAddress.toLowerCase();
      
      const { data, error } = await supabase
        .from('wallet_profiles')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching wallet profile:', error);
        return null;
      }
      
      return data as WalletProfile | null;
    } catch (err) {
      console.error('Error getting wallet profile:', err);
      return null;
    }
  },

  /**
   * Fetch wallet profile with fallback to create if it doesn't exist
   * This is an alias for backward compatibility
   */
  async fetchWalletProfile(walletAddress: string, walletType: string = 'phantom'): Promise<WalletProfile | null> {
    logDebug('WALLET_SERVICE', `Fetching wallet profile with fallback: ${walletAddress}`);
    
    // First try to get existing profile
    const profile = await this.getWalletProfile(walletAddress);
    if (profile) {
      return profile;
    }
    
    // If no profile exists, create one
    return this.ensureWalletProfile(walletAddress, walletType);
  },

  /**
   * Sync wallet profile between local storage and database
   */
  async syncWalletProfile(
    walletAddress: string, 
    localProfile: any = null, 
    prioritizeDb: boolean = true,
    walletType: string = 'phantom'
  ): Promise<WalletProfile | null> {
    try {
      logDebug('WALLET_SERVICE', `Syncing wallet profile: ${walletAddress}, prioritize DB: ${prioritizeDb}`);
      
      // Get profile from database
      const dbProfile = await this.getWalletProfile(walletAddress);
      
      // If database profile exists and we're prioritizing DB
      if (dbProfile && prioritizeDb) {
        logDebug('WALLET_SERVICE', `Using DB profile for ${walletAddress}`);
        
        // Update local storage with DB profile
        localStorage.setItem(`wallet_profile_${walletAddress}`, JSON.stringify(dbProfile));
        return dbProfile;
      }
      
      // If no DB profile but we have local profile
      if (!dbProfile && localProfile) {
        logDebug('WALLET_SERVICE', `Creating DB profile from local for ${walletAddress}`);
        
        // Create profile in DB based on local
        const newProfile = await this.ensureWalletProfile(walletAddress, walletType);
        
        if (newProfile && localProfile?.username) {
          // Update additional fields from local profile
          await this.updateWalletProfile(
            walletAddress,
            {
              username: localProfile.username,
              avatar_url: localProfile.avatar_url,
              points: localProfile.points || 0
            },
            walletType
          );
          
          // Get the updated profile
          return this.getWalletProfile(walletAddress);
        }
        
        return newProfile;
      }
      
      // If we have both profiles, merge based on priority
      if (dbProfile && localProfile) {
        if (!prioritizeDb) {
          logDebug('WALLET_SERVICE', `Merging local profile to DB for ${walletAddress}`);
          
          // Update DB with local data
          await this.updateWalletProfile(
            walletAddress,
            {
              username: localProfile.username,
              avatar_url: localProfile.avatar_url,
              points: localProfile.points || 0
            },
            walletType
          );
          
          // Get the updated profile
          return this.getWalletProfile(walletAddress);
        }
        
        return dbProfile;
      }
      
      // Fallback to create a new profile
      if (!dbProfile && !localProfile) {
        logDebug('WALLET_SERVICE', `Creating new wallet profile for ${walletAddress}`);
        return this.ensureWalletProfile(walletAddress, walletType);
      }
      
      return dbProfile || null;
    } catch (err) {
      console.error('Error syncing wallet profile:', err);
      return null;
    }
  },

  /**
   * Update wallet profile with new data
   */
  async updateWalletProfile(
    walletAddress: string,
    updateData: {
      username?: string;
      avatar_url?: string | null;
      points?: number;
      wallet_type?: string;
    },
    walletType: string = 'phantom'
  ): Promise<boolean> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      logDebug('WALLET_SERVICE', `Updating wallet profile: ${normalizedAddress}`);
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('wallet_profiles')
        .select('id')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      
      if (!existingProfile) {
        // Create profile if it doesn't exist
        const profile = await this.ensureWalletProfile(walletAddress, walletType);
        if (!profile) {
          return false;
        }
      }
      
      // Update the profile
      const { error } = await supabase
        .from('wallet_profiles')
        .update({
          username: updateData.username,
          avatar_url: updateData.avatar_url,
          points: updateData.points,
          wallet_type: updateData.wallet_type || walletType,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', normalizedAddress);
      
      if (error) {
        console.error('Error updating wallet profile:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error updating wallet profile:', err);
      return false;
    }
  }
};
