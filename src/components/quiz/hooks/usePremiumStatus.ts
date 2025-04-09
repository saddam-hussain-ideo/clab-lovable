
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export const usePremiumStatus = (session: Session | null, userId: string | null) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Listen for force refresh events from localStorage
  useEffect(() => {
    const checkForceRefresh = () => {
      const forceCheck = localStorage.getItem('force_premium_check');
      if (forceCheck) {
        console.log("Force premium check triggered:", forceCheck);
        // Convert to number if it's a timestamp, or just use as a trigger
        const timestamp = Number(forceCheck) || Date.now();
        setLastRefresh(timestamp);
        // Clear the force check flag after using it
        localStorage.removeItem('force_premium_check');
      }
    };

    // Set up event listener for storage changes
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'force_premium_check' && event.newValue) {
        console.log("Storage event detected for premium check:", event.newValue);
        checkForceRefresh();
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    // Custom event for in-app notifications
    const handleCustomEvent = () => {
      console.log("Custom premium refresh event detected");
      setLastRefresh(Date.now());
    };

    window.addEventListener('premium_status_updated', handleCustomEvent);

    // Do an initial check
    checkForceRefresh();

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('premium_status_updated', handleCustomEvent);
    };
  }, []);

  // Check premium status whenever userId or lastRefresh changes
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!userId) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("Checking premium status for user:", userId);
        
        // Check if user has a valid premium subscription
        const { data, error } = await supabase
          .from('premium_subscriptions')
          .select('id, expires_at')
          .eq('user_id', userId)
          .or('expires_at.is.null,expires_at.gt.now()')
          .limit(1);

        if (error) {
          console.error("Error checking premium status:", error);
          throw error;
        }

        const hasPremium = data && data.length > 0;
        console.log("Premium status check result:", hasPremium, data);
        setIsPremium(hasPremium);
      } catch (error) {
        console.error("Failed to check premium status:", error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [userId, lastRefresh]); 

  // Function to manually refresh premium status
  const refreshPremiumStatus = () => {
    console.log("Manual refresh of premium status triggered");
    setLastRefresh(Date.now());
    
    // Also update localStorage to notify other components
    localStorage.setItem('force_premium_check', Date.now().toString());
    
    // Dispatch a custom event for in-app notifications
    window.dispatchEvent(new CustomEvent('premium_status_updated'));
  };

  return { isPremium, isLoading, refreshPremiumStatus };
};
