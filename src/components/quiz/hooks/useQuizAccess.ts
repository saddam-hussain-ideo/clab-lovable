import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const FREE_ROUNDS_LIMIT = 5;

export const useQuizAccess = (walletAddress: string | null, userId: string | null) => {
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState<boolean>(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const currentWalletRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const checkInProgressRef = useRef<boolean>(false);
  
  // Add a debounce function to prevent too frequent checks
  const debounce = useCallback((fn: Function, delay: number) => {
    const now = Date.now();
    if (now - lastCheckTimeRef.current > delay) {
      lastCheckTimeRef.current = now;
      fn();
    } else {
      console.log("Access check throttled");
    }
  }, []);
  
  // Function to check access status
  const checkAccess = useCallback(async () => {
    // Prevent concurrent checks
    if (checkInProgressRef.current) {
      console.log("Access check already in progress, skipping");
      return;
    }
    
    try {
      checkInProgressRef.current = true;
      setIsLoading(true);
      
      console.log("Checking quiz access for:", {
        walletAddress: walletAddress ? `${walletAddress.substring(0, 6)}...` : null,
        userId: userId ? `${userId.substring(0, 8)}...` : null
      });
      
      // Validate inputs before proceeding
      if (!walletAddress && !userId) {
        console.log("No wallet or user ID provided, setting default access");
        setHasUnlimitedAccess(false);
        setAttemptsRemaining(FREE_ROUNDS_LIMIT);
        setIsLoading(false);
        return;
      }
      
      // Check if wallet or userId has changed
      if (currentWalletRef.current === walletAddress && currentUserIdRef.current === userId) {
        const elapsed = Date.now() - lastCheckTimeRef.current;
        if (elapsed < 60000) { // Only re-use cache for 1 minute
          console.log("Using cached access state");
          setIsLoading(false);
          return;
        }
      }
      
      // Update refs
      currentWalletRef.current = walletAddress;
      currentUserIdRef.current = userId;
      
      // Reset state
      setHasUnlimitedAccess(false);
      setAttemptsRemaining(null);
      
      // Direct check for presale contributions first (most reliable method)
      let hasPurchased = false;
      
      if (walletAddress) {
        console.log("Directly checking presale contributions for wallet");
        const { data: walletContributions, error: walletError } = await supabase
          .from('presale_contributions')
          .select('id')
          .eq('wallet_address', walletAddress)
          .limit(1);
          
        if (!walletError && walletContributions && walletContributions.length > 0) {
          console.log('Found presale contribution for wallet, granting unlimited access');
          setHasUnlimitedAccess(true);
          setAttemptsRemaining(null);
          setIsLoading(false);
          hasPurchased = true;
          return;
        }
      }
      
      if (userId) {
        console.log("Directly checking presale contributions for user");
        const { data: userContributions, error: userError } = await supabase
          .from('presale_contributions')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
          
        if (!userError && userContributions && userContributions.length > 0) {
          console.log('Found presale contribution for user, granting unlimited access');
          setHasUnlimitedAccess(true);
          setAttemptsRemaining(null);
          setIsLoading(false);
          hasPurchased = true;
          return;
        }
      }
      
      if (!hasPurchased) {
        // Try using the edge function as backup
        try {
          // Use the edge function to verify access (just checking, not consuming an attempt)
          const { data, error } = await supabase.functions.invoke('verify-crypto-payment', {
            body: { 
              userId, 
              walletAddress,
              checkOnly: true
            }
          });
          
          if (error) {
            console.error('Error checking quiz access via edge function:', error);
            throw error;
          }
          
          if (data && data.success) {
            console.log('Access check result:', data);
            setHasUnlimitedAccess(data.hasUnlimitedAccess);
            setAttemptsRemaining(data.attemptsRemaining);
            setIsLoading(false);
            return;
          }
        } catch (edgeFnError) {
          console.error('Edge function error, falling back to direct checks:', edgeFnError);
          // Continue with fallback checks
        }
      }
      
      // FALLBACK: Direct attempt count checks if no unlimited access found
      if (walletAddress && !hasPurchased) {
        // Count wallet attempts
        const { data: attemptData, error: attemptError, count } = await supabase
          .from('wallet_quiz_attempts')
          .select('*', { count: 'exact' })
          .eq('wallet_address', walletAddress);
          
        if (!attemptError && count !== null) {
          const totalAttempts = count;
          const remaining = Math.max(0, FREE_ROUNDS_LIMIT - totalAttempts);
          console.log(`Wallet has made ${totalAttempts} attempts, has ${remaining} remaining`);
          setAttemptsRemaining(remaining);
        } else {
          console.error('Error checking wallet attempts:', attemptError);
          setAttemptsRemaining(FREE_ROUNDS_LIMIT); // Default to full access on error
        }
      }
      
      // Also check user attempts if needed
      if (userId && !hasPurchased) {
        // Count user attempts
        const { data: userAttemptData, error: userAttemptError, count: userCount } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact' })
          .eq('user_id', userId);
          
        if (!userAttemptError && userCount !== null) {
          const totalAttempts = userCount;
          const remaining = Math.max(0, FREE_ROUNDS_LIMIT - totalAttempts);
          console.log(`User has made ${totalAttempts} attempts, has ${remaining} remaining`);
          setAttemptsRemaining(remaining);
        } else {
          console.error('Error checking user attempts:', userAttemptError);
          setAttemptsRemaining(FREE_ROUNDS_LIMIT); // Default to full access on error
        }
      }
    } catch (error) {
      console.error('Error checking quiz access:', error);
      // Fall back to free tier on error - allow access rather than blocking incorrectly
      setHasUnlimitedAccess(false);
      setAttemptsRemaining(FREE_ROUNDS_LIMIT);
    } finally {
      setIsLoading(false);
      checkInProgressRef.current = false;
    }
  }, [walletAddress, userId]);
  
  // Listen for wallet changes
  useEffect(() => {
    const handleWalletChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("useQuizAccess: Wallet change event detected", customEvent.detail);
      
      if (customEvent.detail?.action === 'disconnected') {
        // Reset quiz access state when wallet disconnects
        setHasUnlimitedAccess(false);
        setAttemptsRemaining(FREE_ROUNDS_LIMIT);
        currentWalletRef.current = null;
      } else {
        // Force refresh on any other wallet change
        debounce(checkAccess, 1000);
      }
    };
    
    window.addEventListener('walletChanged', handleWalletChange);
    return () => window.removeEventListener('walletChanged', handleWalletChange);
  }, [debounce, checkAccess]);
  
  // Listen for quiz activity updates
  useEffect(() => {
    const handleQuizActivityUpdate = () => {
      console.log("useQuizAccess: Quiz activity update detected, refreshing attempts");
      debounce(checkAccess, 1000);
    };
    
    window.addEventListener('quizActivityUpdated', handleQuizActivityUpdate);
    return () => window.removeEventListener('quizActivityUpdated', handleQuizActivityUpdate);
  }, [debounce, checkAccess]);

  // Listen for presale contribution updates
  useEffect(() => {
    const handleContributionUpdate = () => {
      console.log("useQuizAccess: Presale contribution update detected, refreshing access");
      debounce(checkAccess, 1000);
    };
    
    window.addEventListener('presaleContributionUpdated', handleContributionUpdate);
    return () => window.removeEventListener('presaleContributionUpdated', handleContributionUpdate);
  }, [debounce, checkAccess]);
  
  // Initial check for access
  useEffect(() => {
    checkAccess();
  }, [walletAddress, userId, checkAccess]);
  
  const checkAccessForNewQuiz = async (): Promise<boolean> => {
    // If we're already loading, wait for the current check to complete
    if (isLoading || checkInProgressRef.current) {
      console.log("Access check already in progress, waiting...");
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // If has unlimited access, always allow
    if (hasUnlimitedAccess) {
      return true;
    }
    
    // Force a fresh check first
    await checkAccess();
    
    // If no wallet connected, don't allow
    if (!walletAddress && !userId) {
      return false;
    }
    
    console.log(`Checking access for new quiz: hasUnlimitedAccess=${hasUnlimitedAccess}, attemptsRemaining=${attemptsRemaining}`);
    
    // Check if we need to consume an attempt
    if (attemptsRemaining !== null && attemptsRemaining > 0) {
      try {
        // Use the edge function to verify and CONSUME an attempt
        const { data, error } = await supabase.functions.invoke('verify-crypto-payment', {
          body: { 
            userId, 
            walletAddress,
            checkOnly: false // This will consume an attempt
          }
        });
        
        if (error) {
          console.error('Error verifying quiz access via edge function:', error);
          toast({
            title: "Error checking access",
            description: "Please try again",
            variant: "destructive"
          });
          return false;
        }
        
        if (data && data.success) {
          // Update local state with the new attempts count
          setAttemptsRemaining(data.attemptsRemaining);
          
          if (data.attemptsRemaining <= 2 && data.attemptsRemaining > 0) {
            toast({
              title: `${data.attemptsRemaining} free ${data.attemptsRemaining === 1 ? 'round' : 'rounds'} remaining`,
              description: "Purchase CLAB tokens to get unlimited access!",
              variant: "default"
            });
          }
          
          // Dispatch event to update any other components
          window.dispatchEvent(new CustomEvent('quizActivityUpdated'));
          
          // Allow access if we have attempts remaining or unlimited access
          return data.hasUnlimitedAccess || data.attemptsRemaining > 0;
        }
        
        return false; // Something went wrong
      } catch (error) {
        console.error('Error verifying quiz access:', error);
        return false;
      }
    } else if (attemptsRemaining !== null && attemptsRemaining <= 0) {
      // No attempts remaining, show upgrade dialog
      setShowUpgradeDialog(true);
      toast({
        title: "No free rounds remaining",
        description: "Purchase CLAB tokens to get unlimited access!",
        variant: "destructive"
      });
      return false;
    }
    
    // Default fallback - only grant unlimited users
    return hasUnlimitedAccess;
  };
  
  return { 
    hasUnlimitedAccess,
    attemptsRemaining, 
    isLoading,
    showUpgradeDialog,
    setShowUpgradeDialog,
    checkAccessForNewQuiz,
    refreshAccess: () => debounce(checkAccess, 1000) // Export the refresh function for manual refreshes with debounce
  };
};
