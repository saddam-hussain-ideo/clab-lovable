import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';
import { WalletType } from '@/services/wallet/walletService';
import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';
import { walletSessionManager } from '@/services/wallet/walletSessionManager';

export const useProfileData = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<string | null>(null);
  const isConnected = walletSessionManager.isConnected();

  // Define fetchProfile function
  const fetchProfile = useCallback(async (forceRefresh = false): Promise<Profile | null> => {
    // Get current wallet info
    const walletAddress = localStorage.getItem('walletAddress');
    const walletType = localStorage.getItem('walletType') as WalletType;
    const sessionId = walletSessionManager.getCurrentSessionId();

    if (!walletAddress || !walletType) {
      console.log('[useProfileData] No wallet connected, cannot fetch profile');
      setLoading(false);
      return null;
    }

    setLoading(true);
    setHasError(false);
    setProfileError(null);
    
    // Generate a unique ID for this request to handle race conditions
    const requestId = `${Date.now()}_${Math.random()}`;
    currentRequestRef.current = requestId;

    try {
      console.log(`[useProfileData] Fetching profile for ${walletType}:${walletAddress.slice(0, 8)}...`);
      
      // First check localStorage cache
      const cacheKey = `profile_${walletType}_${walletAddress}`;
      const cachedProfile = localStorage.getItem(cacheKey);
      
      if (cachedProfile && !forceRefresh) {
        try {
          const parsedProfile = JSON.parse(cachedProfile) as Profile;
          console.log(`[useProfileData] Using cached profile for ${walletType}:${walletAddress.slice(0, 8)}`);
          setProfile(parsedProfile);
          setLoading(false);
          return parsedProfile;
        } catch (e) {
          console.error('[useProfileData] Error parsing cached profile:', e);
          localStorage.removeItem(cacheKey);
        }
      }
      
      // If no valid cache or force refresh, check database directly
      console.log(`[useProfileData] Checking database for ${walletType}:${walletAddress.slice(0, 8)}...`);
      
      const { data: existingProfile, error: checkError } = await supabase
        .from('wallet_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('wallet_type', walletType)
        .maybeSingle();
      
      if (checkError) {
        console.error('[useProfileData] Error checking profile existence:', checkError);
        throw checkError;
      }
      
      if (existingProfile) {
        // Profile exists in database
        console.log(`[useProfileData] Found profile in database for ${walletType}:${walletAddress.slice(0, 8)}`);
        const dbProfile = existingProfile as Profile;
        
        // Cache the profile
        localStorage.setItem(cacheKey, JSON.stringify(dbProfile));
        
        setProfile(dbProfile);
        setLoading(false);
        return dbProfile;
      }
      
      // No profile found, create a new one
      console.log(`[useProfileData] No profile found, creating new one for ${walletType}:${walletAddress.slice(0, 8)}...`);
      
      // Create a default profile for this specific wallet
      const newProfile: Profile = {
        wallet_address: walletAddress,
        wallet_type: walletType,
        username: `${walletType === 'phantom' ? 'Solana' : 'Eth'}_${walletAddress.slice(0, 6)}`,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        points: 0,
        id: null
      };
      
      // Insert the profile into the database
      const { data: insertData, error: insertError } = await supabase
        .from('wallet_profiles')
        .insert({
          wallet_address: walletAddress,
          wallet_type: walletType,
          username: newProfile.username,
          avatar_url: newProfile.avatar_url,
          points: newProfile.points || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*');
      
      if (insertError) {
        console.error('[useProfileData] Error creating profile:', insertError);
        // If we can't create in database, use the local version as fallback
        setProfile(newProfile);
        setLoading(false);
        return newProfile;
      }
      
      if (insertData && insertData.length > 0) {
        // Use the newly created profile with its database ID
        const savedProfile = insertData[0] as Profile;
        console.log(`[useProfileData] Successfully created profile with ID: ${savedProfile.id}`);
        
        // Cache the profile
        localStorage.setItem(cacheKey, JSON.stringify(savedProfile));
        
        setProfile(savedProfile);
        setLoading(false);
        return savedProfile;
      }
      
      // If database insert failed, use the local version as fallback
      console.warn(`[useProfileData] Using local profile for ${walletType}:${walletAddress}`);
      setProfile(newProfile);
      setLoading(false);
      return newProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to load profile');
      setHasError(true);
      setLoading(false);
      return null;
    }
  }, []);

  // Fetch profile data
  useEffect(() => {
    if (isConnected) {
      console.log('[useProfileData] Wallet connected, fetching profile data');
      fetchProfile().catch(err => {
        console.error('[useProfileData] Error fetching profile:', err);
        setHasError(true);
        setProfileError(err instanceof Error ? err.message : 'Failed to load profile');
      });
    } else {
      console.log('[useProfileData] No wallet connected, clearing profile data');
      setProfile(null);
      setLoading(false);
      setHasError(false);
      setProfileError(null);
    }
  }, [isConnected, fetchProfile]);

  // Listen for wallet changes
  useEffect(() => {
    const walletAddress = localStorage.getItem('walletAddress');
    const walletType = localStorage.getItem('walletType');
    
    if (walletAddress && walletType && isConnected) {
      console.log(`[useProfileData] Wallet detected: ${walletType}:${walletAddress.slice(0, 8)}`);
      
      // Check if we have a profile for this wallet
      fetchProfile().catch(err => {
        console.error('[useProfileData] Error fetching profile on wallet change:', err);
      });
    }
  }, [fetchProfile, isConnected]);

  // Listen for wallet session events
  useEffect(() => {
    const handleSessionChanged = (event: Event) => {
      if (event instanceof CustomEvent) {
        // Clear current profile when session changes
        setProfile(null);

        // Clear any pending retries
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }

        // Fetch profile for new session
        fetchProfile(true);
      }
    };

    const handleSessionEnded = () => {
      // Clear profile on session end
      setProfile(null);
      setProfileError(null);
      setLoading(false);

      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    const handleResetApplicationState = () => {
      // Reset all hook state
      setProfile(null);
      setProfileError(null);
      setLoading(false);
      setHasError(false);

      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
    
    const handleProfileLoaded = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.profile) {
        const loadedProfile = event.detail.profile as Profile;
        console.log(`[useProfileData] Received profileLoaded event for ${loadedProfile.wallet_type}:${loadedProfile.wallet_address?.slice(0, 8)}`);
        
        // Update profile state
        setProfile(loadedProfile);
        setLoading(false);
        setHasError(false);
        setProfileError(null);
      }
    };

    // Listen for events
    window.addEventListener('walletSessionChanged', handleSessionChanged);
    window.addEventListener('walletSessionEnded', handleSessionEnded);
    window.addEventListener('resetApplicationState', handleResetApplicationState);
    window.addEventListener('clearQueryCache', () => fetchProfile(true));
    window.addEventListener('profileLoaded', handleProfileLoaded);

    return () => {
      window.removeEventListener('walletSessionChanged', handleSessionChanged);
      window.removeEventListener('walletSessionEnded', handleSessionEnded);
      window.removeEventListener('resetApplicationState', handleResetApplicationState);
      window.removeEventListener('clearQueryCache', () => fetchProfile(true));
      window.removeEventListener('profileLoaded', handleProfileLoaded);

      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async (forceRefresh = false) => {
    return fetchProfile(forceRefresh);
  }, [fetchProfile]);

  // Handle profile errors
  useEffect(() => {
    if (profileError) {
      setHasError(true);
      toast.error(profileError);

      // Reset error state after 5 seconds
      const timeout = setTimeout(() => {
        setProfileError(null);
        setHasError(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [profileError]);

  return {
    profile,
    setProfile,
    loading,
    profileError,
    refreshProfile,
    hasError
  };
};
