
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';

// Get environment variables with fallbacks to prevent initialization errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vyagsvyrwgmmdmwdbzla.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWdzdnlyd2dtbWRtd2RiemxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTE3NDYsImV4cCI6MjA1NTc2Nzc0Nn0.uZoZ9iGS4RDA74tBy2aOPNtNuoo7bAlvxkusdPLGQkA';

// Safe method to access localStorage/sessionStorage
const isStorageAvailable = (type: 'localStorage' | 'sessionStorage'): boolean => {
  try {
    const storage = window[type] as Storage;
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

// Create the client with even stricter cache-control headers 
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Cache-Bust': Date.now().toString(),
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `supabase.auth.token.${Date.now().toString().slice(0, 5)}` // Slightly randomize storage key
    },
  }
);

// Helper function for fetching CMS content with error handling
export const fetchCmsContent = async (pageId: string, sectionId: string, defaultData: any = {}) => {
  try {
    console.log(`Fetching CMS content for ${pageId}/${sectionId}`);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 8000);
    });
    
    // Add cache-busting parameter
    const cacheBuster = Date.now().toString();
    
    // Actual fetch operation with proper query parameters and cache busting
    const fetchPromise = supabase
      .from("page_content")
      .select("content")
      .eq("page_id", pageId)
      .eq("section_id", sectionId)
      .maybeSingle();
      
    // Race between fetch and timeout
    const result = await Promise.race([
      fetchPromise,
      timeoutPromise
    ]) as any;
    
    // Add detailed logging to help debug
    console.log(`Fetch result for ${pageId}/${sectionId}:`, result);
    
    // Handle errors and empty results
    if (result.error) {
      console.error(`Error fetching ${pageId}/${sectionId}:`, result.error);
      return defaultData;
    }
    
    // If no data returned, use default
    if (!result.data) {
      console.log(`No data found for ${pageId}/${sectionId}, using default values`);
      return defaultData;
    }
    
    // Aggressively clear any local storage cache for this page/section
    if (isStorageAvailable('localStorage')) {
      try {
        // Clear all keys that might be related to the page
        Object.keys(localStorage).forEach(key => {
          if (key.includes(pageId) || key.includes(sectionId) || key.includes('supabase.auth') || key.includes('admin')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn("Failed to clear localStorage cache:", e);
      }
    }
    
    if (isStorageAvailable('sessionStorage')) {
      try {
        // Clear all keys that might be related to the page
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes(pageId) || key.includes(sectionId) || key.includes('supabase.auth') || key.includes('admin')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn("Failed to clear sessionStorage cache:", e);
      }
    }
    
    return result.data.content;
  } catch (err) {
    console.error(`Failed to fetch ${pageId}/${sectionId}:`, err);
    return defaultData;
  }
};

// Hook to get and track the session
export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes to auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change event:", event);
      setSession(session);
      
      // Handle session expiration or removal
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        console.log("Auth state change - clearing session:", event);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return session;
};

// Custom hook to sign out with enhanced error handling
export const useSignOut = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });
      
      // Ignore 'session missing' errors as they just mean we're already logged out
      if (error && !error.message.includes('session missing')) {
        throw error;
      }
      
      // Clear any stored tokens or session data
      if (isStorageAvailable('localStorage')) {
        // Clear all potentially related items
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('admin') || key.includes('token')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      if (isStorageAvailable('sessionStorage')) {
        // Clear all potentially related items
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('admin') || key.includes('token')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      // Force reload the page to clear any in-memory cache
      window.location.reload();
      
      return { success: true };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };
  
  return { signOut, isLoading, error };
};
