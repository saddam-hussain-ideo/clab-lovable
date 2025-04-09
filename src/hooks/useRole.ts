import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useVisibility } from '@/hooks/useVisibility';

// Utility for safe storage operations with improved error handling
const safeStorage = {
  getItem: (key: string, storageType: 'localStorage' | 'sessionStorage' = 'localStorage'): string | null => {
    try {
      const storage = window[storageType];
      return storage.getItem(key);
    } catch (e) {
      console.warn(`Failed to read from ${storageType}:`, e);
      return null;
    }
  },
  setItem: (key: string, value: string, storageType: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean => {
    try {
      const storage = window[storageType];
      storage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`Failed to write to ${storageType}:`, e);
      return false;
    }
  },
  removeItem: (key: string, storageType: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean => {
    try {
      const storage = window[storageType];
      storage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`Failed to remove from ${storageType}:`, e);
      return false;
    }
  }
};

export const useRole = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const { toast } = useToast();
  
  // Track if we're in an active tab
  const [isActive, setIsActive] = useState(true);
  const isInitialLoadRef = useRef(true);
  const debugLogRef = useRef<string[]>([]);
  
  // Helper function to add debug logs
  const addDebugLog = (message: string) => {
    const logMsg = `${new Date().toISOString().split('T')[1]} - ${message}`;
    console.log(logMsg);
    debugLogRef.current = [...debugLogRef.current, logMsg].slice(-50); // Keep last 50 logs
  };
  
  // Use the visibility hook to track tab visibility
  useVisibility(
    // onVisible
    () => {
      addDebugLog('Role hook: tab became visible');
      setIsActive(true);
      
      // Force admin check when tab becomes visible again
      if (!isInitialLoadRef.current) {
        checkAdminRole(true);
      }
    },
    // onHidden
    () => {
      addDebugLog('Role hook: tab hidden');
      setIsActive(false);
    }
  );
  
  // Store the admin status in both sessionStorage and localStorage
  const storeAdminStatus = (status: boolean, uid: string) => {
    const timestamp = Date.now();
    const data = JSON.stringify({
      isAdmin: status,
      userId: uid,
      timestamp
    });
    
    safeStorage.setItem('adminRoleData', data, 'sessionStorage');
    safeStorage.setItem('adminRoleData', data, 'localStorage');
    
    // Also set the individual flag for backward compatibility
    safeStorage.setItem('isAdmin', status ? 'true' : 'false', 'sessionStorage');
    safeStorage.setItem('isAdmin', status ? 'true' : 'false', 'localStorage');
    
    setLastCheck(timestamp);
  };
  
  // Get the admin status from storage
  const getStoredAdminStatus = (): { isAdmin: boolean, userId: string, timestamp: number } | null => {
    try {
      // Try sessionStorage first
      let stored = safeStorage.getItem('adminRoleData', 'sessionStorage');
      
      // Fall back to localStorage if needed
      if (!stored) {
        stored = safeStorage.getItem('adminRoleData', 'localStorage');
      }
      
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Legacy format fallback
      const legacyStatus = safeStorage.getItem('isAdmin', 'sessionStorage') || 
                          safeStorage.getItem('isAdmin', 'localStorage');
      
      if (legacyStatus === 'true' || legacyStatus === 'false') {
        return {
          isAdmin: legacyStatus === 'true',
          userId: 'unknown',
          timestamp: 0
        };
      }
      
      return null;
    } catch (e) {
      console.warn('Could not parse stored admin status:', e);
      return null;
    }
  };

  const checkAdminRole = useCallback(async (forceCheck = false) => {
    // Skip check if tab is not active to prevent unnecessary role checks
    if (!isActive && !forceCheck && !isInitialLoadRef.current) {
      addDebugLog('Skipping admin role check - tab not active');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addDebugLog('No session found, user is not authenticated');
        setIsAdmin(false);
        setUserId(null);
        storeAdminStatus(false, 'none');
        setIsLoading(false);
        return false;
      }
      
      const currentUserId = session.user.id;
      setUserId(currentUserId);
      
      // Try to get cached admin status if not forcing a check
      // Reducing cache validity to just 1 minute (60000 ms)
      if (!forceCheck) {
        const storedData = getStoredAdminStatus();
        const now = Date.now();
        const cacheAge = now - (storedData?.timestamp || 0);
        // Cache is only valid for 1 minute
        const isRecentCache = cacheAge < 60000; // 1 minute cache validity
        
        if (storedData && storedData.userId === currentUserId && isRecentCache) {
          addDebugLog(`Using cached admin status (${cacheAge/1000}s old): ${storedData.isAdmin}`);
          setIsAdmin(storedData.isAdmin);
          setIsLoading(false);
          return storedData.isAdmin;
        }
      }
      
      addDebugLog('Checking admin role for user: ' + currentUserId);
      
      // First try to get the role directly from the user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUserId);

      if (rolesError) {
        addDebugLog('Error checking user_roles table: ' + rolesError.message);
        console.error('Error checking user_roles table:', rolesError);
        throw rolesError;
      }

      if (userRoles && userRoles.length > 0) {
        const hasAdminRole = userRoles.some(role => role.role === 'admin');
        addDebugLog('User roles from table: ' + JSON.stringify(userRoles) + ', Has admin role: ' + hasAdminRole);
        setIsAdmin(hasAdminRole);
        storeAdminStatus(hasAdminRole, currentUserId);
        setIsLoading(false);
        return hasAdminRole;
      } else {
        // Fallback to using the RPC function
        addDebugLog('No roles found in user_roles table, using RPC function');
        const { data, error } = await supabase
          .rpc('has_role', {
            user_id: currentUserId,
            required_role: 'admin'
          });

        if (error) {
          addDebugLog('Error checking admin role via RPC: ' + error.message);
          console.error('Error checking admin role via RPC:', error);
          throw error;
        }
        
        addDebugLog('RPC has_role result: ' + data);
        setIsAdmin(!!data);
        storeAdminStatus(!!data, currentUserId);
        setIsLoading(false);
        return !!data;
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      addDebugLog('Error checking admin role: ' + error.message);
      // No toast here to prevent UI issues during navigation
      setIsAdmin(false);
      setUserId(null);
      storeAdminStatus(false, 'error');
      setIsLoading(false);
      return false;
    } finally {
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [isActive]);

  // Clear admin status cache - useful when there are issues
  const clearAdminCache = useCallback(() => {
    safeStorage.removeItem('adminRoleData', 'sessionStorage');
    safeStorage.removeItem('adminRoleData', 'localStorage');
    safeStorage.removeItem('isAdmin', 'sessionStorage');
    safeStorage.removeItem('isAdmin', 'localStorage');
    safeStorage.removeItem('adminAccess', 'sessionStorage');
    safeStorage.removeItem('adminAccess', 'localStorage');
    console.log('Admin cache cleared');
  }, []);

  useEffect(() => {
    // Check admin role on initial mount
    checkAdminRole();

    // Listen for auth state changes and check role again if needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Force check when signed in or token refreshed
        checkAdminRole(true);
      } else if (event === 'SIGNED_OUT') {
        // Clear admin status when signed out
        setIsAdmin(false);
        setUserId(null);
        storeAdminStatus(false, 'none');
        clearAdminCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminRole, clearAdminCache]);

  return { 
    isAdmin, 
    isLoading, 
    checkAdminRole, 
    clearAdminCache, 
    userId,
    debugLogs: debugLogRef.current 
  };
};
