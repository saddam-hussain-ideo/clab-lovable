import { WalletType } from './walletService';
import { logDebug } from '@/utils/debugLogging';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';

/**
 * WalletSessionManager
 * 
 * Responsible for managing wallet sessions and ensuring complete isolation
 * between different wallet connections.
 */
export class WalletSessionManager {
  private currentSessionId: string | null = null;
  private sessionTimeout: number = 5000; // 5s timeout for operations
  
  /**
   * Start a new isolated wallet session
   */
  async startNewSession(walletType: WalletType, walletAddress: string): Promise<void> {
    // End any existing session
    await this.endCurrentSession();
    
    // Clear all browser storage
    this.clearAllStorage();
    
    // Create new session ID
    this.currentSessionId = `session_${walletType}_${walletAddress}_${Date.now()}`;
    
    // Store session info
    localStorage.setItem('currentWalletSession', this.currentSessionId);
    localStorage.setItem('walletAddress', walletAddress);
    localStorage.setItem('walletType', walletType);
    localStorage.setItem('walletConnectedAt', Date.now().toString());
    
    logDebug('SESSION', `Started new wallet session: ${this.currentSessionId}`);
    
    // Immediately load profile for this wallet to ensure it's available
    this.loadProfileForCurrentWallet();
    
    // Broadcast session change
    window.dispatchEvent(new CustomEvent('walletSessionChanged', {
      detail: {
        sessionId: this.currentSessionId,
        walletType,
        walletAddress,
        timestamp: Date.now()
      }
    }));
  }
  
  /**
   * End the current wallet session and clean up all data
   */
  async endCurrentSession(): Promise<void> {
    if (!this.currentSessionId) return;
    
    logDebug('SESSION', `Ending session: ${this.currentSessionId}`);
    
    // Clear all wallet-related storage
    this.clearAllStorage();
    
    // Reset session ID
    this.currentSessionId = null;
    
    // Broadcast session end
    window.dispatchEvent(new CustomEvent('walletSessionEnded', {
      detail: { timestamp: Date.now() }
    }));
  }
  
  /**
   * Completely clear all wallet-related storage
   * Note: We preserve profile data in the database, only clearing session-specific data
   */
  clearAllStorage(): void {
    // Clear standard wallet session keys
    localStorage.removeItem('currentWalletSession');
    localStorage.removeItem('walletConnectedAt');
    
    // Clear session-specific data but preserve profile data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('wallet_') || 
        key.includes('token') || 
        key.includes('transaction') ||
        key.includes('presale') ||
        key.includes('points') ||
        key.includes('quiz_') ||
        key.includes('_wallet_')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      logDebug('SESSION', `Removed localStorage key: ${key}`);
    });
    
    try {
      // Clear session storage too
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing sessionStorage:', e);
    }
    
    // Clear React Query cache
    window.dispatchEvent(new CustomEvent('clearQueryCache'));
  }
  
  /**
   * Saves a wallet profile to the database and updates the cache
   * @param profile The profile to save
   * @returns True if the profile was saved successfully
   */
  async saveProfile(profile: Profile): Promise<boolean> {
    if (!profile.wallet_address || !profile.wallet_type) {
      console.error('[walletSessionManager] Cannot save profile without wallet_address and wallet_type');
      return false;
    }
    
    try {
      console.log('[walletSessionManager] Saving profile for wallet:', {
        address: profile.wallet_address.slice(0, 8),
        type: profile.wallet_type
      });
      
      // First, check if the profile already exists in the database
      const { data: existingProfile, error: checkError } = await supabase
        .from('wallet_profiles')
        .select('id')
        .eq('wallet_address', profile.wallet_address)
        .eq('wallet_type', profile.wallet_type)
        .maybeSingle();
      
      if (checkError) {
        console.error('[walletSessionManager] Error checking profile existence:', checkError);
        return false;
      }
      
      let success = false;
      let savedProfileId = null;
      
      if (!existingProfile) {
        // Profile doesn't exist, create a new one
        console.log('[walletSessionManager] No existing profile found, creating new one');
        
        const { data: insertData, error: insertError } = await supabase
          .from('wallet_profiles')
          .insert({
            wallet_address: profile.wallet_address,
            wallet_type: profile.wallet_type,
            username: profile.username || `${profile.wallet_type}_${profile.wallet_address.slice(0, 6)}`,
            avatar_url: profile.avatar_url,
            points: profile.points || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*');
        
        if (insertError) {
          console.error('[walletSessionManager] Error creating profile:', insertError);
          return false;
        }
        
        if (insertData && insertData.length > 0) {
          success = true;
          savedProfileId = insertData[0].id;
          console.log('[walletSessionManager] Created new profile with ID:', savedProfileId);
        }
      } else {
        // Profile exists, update it
        console.log('[walletSessionManager] Updating existing profile with ID:', existingProfile.id);
        
        const { error: updateError } = await supabase
          .from('wallet_profiles')
          .update({
            username: profile.username,
            avatar_url: profile.avatar_url,
            points: profile.points || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);
        
        if (updateError) {
          console.error('[walletSessionManager] Error updating profile:', updateError);
          return false;
        }
        
        success = true;
        savedProfileId = existingProfile.id;
      }
      
      if (success) {
        // Update the profile in localStorage cache
        try {
          // Include the database ID in the cached profile
          const profileWithId = {
            ...profile,
            id: savedProfileId
          };
          
          const cacheKey = `profile_${profile.wallet_type}_${profile.wallet_address}`;
          localStorage.setItem(cacheKey, JSON.stringify(profileWithId));
          console.log('[walletSessionManager] Updated profile cache:', cacheKey);
        } catch (cacheError) {
          console.error('[walletSessionManager] Failed to update profile cache:', cacheError);
          // Continue even if caching fails
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[walletSessionManager] Error saving profile:', error);
      return false;
    }
  }
  
  /**
   * Gets a profile for a specific wallet, ensuring isolation between different wallet sessions
   * @param walletAddress The wallet address
   * @param walletType The wallet type
   * @returns The profile or null if not found
   */
  async getIsolatedProfile(walletAddress: string, walletType: WalletType): Promise<Profile | null> {
    if (!walletAddress || !walletType) {
      console.error('[walletSessionManager] Cannot get profile without wallet_address and wallet_type');
      return null;
    }
    
    try {
      // First check localStorage cache for faster retrieval
      const cacheKey = `profile_${walletType}_${walletAddress}`;
      const cachedProfile = localStorage.getItem(cacheKey);
      
      if (cachedProfile) {
        try {
          const parsedProfile = JSON.parse(cachedProfile) as Profile;
          console.log(`[walletSessionManager] Found cached profile for ${walletType}:${walletAddress.slice(0, 8)}`);
          return parsedProfile;
        } catch (parseError) {
          console.error('[walletSessionManager] Error parsing cached profile:', parseError);
          // Continue to fetch from database if cache parsing fails
          localStorage.removeItem(cacheKey); // Remove invalid cache
        }
      }
      
      // No valid cache, fetch from database
      console.log(`[walletSessionManager] Fetching profile from database for ${walletType}:${walletAddress.slice(0, 8)}`);
      
      const { data, error } = await supabase
        .from('wallet_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('wallet_type', walletType)
        .maybeSingle();
      
      if (error) {
        // Check if this is a schema error (like missing column)
        if (error.code === 'PGRST204') {
          console.error('[walletSessionManager] Database schema error:', error.message);
          // Return null instead of throwing for schema errors
          return null;
        }
        console.error('[walletSessionManager] Error fetching profile:', error);
        return null;
      }
      
      if (data) {
        // Profile found, update cache
        const profile = data as Profile;
        console.log(`[walletSessionManager] Found profile in database with ID: ${profile.id}`);
        
        // Update cache
        localStorage.setItem(cacheKey, JSON.stringify(profile));
        
        return profile;
      }
      
      console.log(`[walletSessionManager] No profile found for ${walletType}:${walletAddress.slice(0, 8)}`);
      
      // Create a new profile since none exists
      return this.createDefaultProfile(walletAddress, walletType);
    } catch (error) {
      console.error('[walletSessionManager] Error getting profile:', error);
      return null;
    }
  }
  
  /**
   * Creates a default profile for a wallet
   * @param walletAddress The wallet address
   * @param walletType The wallet type
   * @returns The created profile or null if creation failed
   */
  async createDefaultProfile(walletAddress: string, walletType: WalletType): Promise<Profile | null> {
    try {
      // First check if profile already exists to avoid duplicate key error
      const { data: existingProfile } = await supabase
        .from('wallet_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('wallet_type', walletType)
        .single();

      if (existingProfile) {
        console.log('[walletSessionManager] Profile already exists, returning existing profile');
        return existingProfile as Profile;
      }

      // Generate a unique username with more randomness to avoid collisions
      const shortAddr = walletAddress.slice(0, 6);
      const randomString = Math.random().toString(36).substring(2, 8);
      const timestamp = Date.now().toString().slice(-6);
      const username = `user_${shortAddr}_${randomString}_${timestamp}`;

      // Create profile object with only the fields that exist in the database
      // Only include fields that are confirmed to exist in the database schema
      const newProfile = {
        wallet_address: walletAddress,
        wallet_type: walletType,
        username: username,
        avatar_url: null,
        points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[walletSessionManager] Creating new profile with fields:', Object.keys(newProfile).join(', '));

      // Try to insert the profile, handling potential duplicate key errors
      let retryCount = 0;
      let data = null;
      let error = null;

      while (retryCount < 3) {
        const result = await supabase
          .from('wallet_profiles')
          .insert([newProfile])
          .select()
          .single();
        
        data = result.data;
        error = result.error;

        if (!error) {
          break; // Success, exit the loop
        }

        // Check if it's a duplicate key error
        if (error.code === '23505') {
          if (error.message.includes('wallet_profiles_wallet_address_wallet_type_key')) {
            // This wallet already has a profile, try to fetch it instead
            const { data: existingWalletProfile } = await supabase
              .from('wallet_profiles')
              .select('*')
              .eq('wallet_address', walletAddress)
              .eq('wallet_type', walletType)
              .single();
            
            if (existingWalletProfile) {
              console.log('[walletSessionManager] Found existing profile for this wallet');
              return existingWalletProfile as Profile;
            }
          } else if (error.message.includes('wallet_profiles_username_unique_idx')) {
            // Username collision, generate a new one and retry
            const newRandomString = Math.random().toString(36).substring(2, 10);
            const newTimestamp = Date.now().toString();
            newProfile.username = `user_${shortAddr}_${newRandomString}_${newTimestamp}`;
            console.log('[walletSessionManager] Username collision, retrying with:', newProfile.username);
            retryCount++;
            continue;
          }
        }

        // Other error, break the loop
        console.error('[walletSessionManager] Error creating profile:', error);
        break;
      }

      if (error) {
        console.error('[walletSessionManager] Error creating default profile after retries:', error);
        return null;
      }

      console.log('[walletSessionManager] Successfully created profile');
      return data as Profile;
    } catch (error) {
      console.error('[walletSessionManager] Error creating default profile:', error);
      return null;
    }
  }
  
  /**
   * Load profile for the currently connected wallet
   * This ensures profile data is immediately available after wallet connection
   */
  async loadProfileForCurrentWallet(): Promise<Profile | null> {
    const walletAddress = localStorage.getItem('walletAddress');
    const walletType = localStorage.getItem('walletType') as WalletType;
    
    if (!walletAddress || !walletType) {
      console.log('[walletSessionManager] No wallet connected, cannot load profile');
      return null;
    }
    
    console.log(`[walletSessionManager] Loading profile for current wallet: ${walletType}:${walletAddress.slice(0, 8)}...`);
    
    try {
      // First check cache
      const cacheKey = `profile_${walletType}_${walletAddress}`;
      const cachedProfile = localStorage.getItem(cacheKey);
      
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile) as Profile;
          console.log(`[walletSessionManager] Using cached profile for ${walletType}:${walletAddress.slice(0, 8)}`);
          
          // Dispatch profile loaded event
          this.dispatchProfileLoaded(profile);
          
          return profile;
        } catch (e) {
          console.error('[walletSessionManager] Error parsing cached profile:', e);
          localStorage.removeItem(cacheKey);
        }
      }
      
      // Get profile from database
      const profile = await this.getIsolatedProfile(walletAddress, walletType);
      
      if (profile) {
        console.log(`[walletSessionManager] Loaded profile from database for ${walletType}:${walletAddress.slice(0, 8)}`);
        
        // Dispatch profile loaded event
        this.dispatchProfileLoaded(profile);
        
        return profile;
      }
      
      // No profile found, create one
      console.log(`[walletSessionManager] No profile found, creating default for ${walletType}:${walletAddress.slice(0, 8)}`);
      const newProfile = await this.createDefaultProfile(walletAddress, walletType);
      
      if (newProfile) {
        // Dispatch profile loaded event
        this.dispatchProfileLoaded(newProfile);
      }
      
      return newProfile;
    } catch (error) {
      console.error('[walletSessionManager] Error loading profile for current wallet:', error);
      return null;
    }
  }
  
  /**
   * Dispatch profile loaded event
   * This allows components to update when a profile is loaded
   */
  private dispatchProfileLoaded(profile: Profile): void {
    window.dispatchEvent(new CustomEvent('profileLoaded', {
      detail: {
        profile,
        timestamp: Date.now()
      }
    }));
    
    console.log(`[walletSessionManager] Dispatched profileLoaded event for ${profile.wallet_type}:${profile.wallet_address?.slice(0, 8)}`);
  }
  
  /**
   * Get the current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
  
  /**
   * Check if a wallet session is active
   */
  hasActiveSession(): boolean {
    return !!this.currentSessionId;
  }
  
  /**
   * Check if a wallet is currently connected
   * @returns true if a wallet is connected, false otherwise
   */
  isConnected(): boolean {
    const walletAddress = localStorage.getItem('walletAddress');
    const walletType = localStorage.getItem('walletType');
    
    return !!(walletAddress && walletType);
  }
  
  /**
   * Execute an operation with session locking
   */
  async withSessionLock<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const attempt = async () => {
        if (!this.hasActiveSession()) {
          return reject(new Error('No active wallet session'));
        }

        if (Date.now() - startTime > this.sessionTimeout) {
          return reject(new Error('Wallet operation timed out'));
        }

        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      attempt();
    });
  }
}

// Create and export singleton instance
export const walletSessionManager = new WalletSessionManager();
