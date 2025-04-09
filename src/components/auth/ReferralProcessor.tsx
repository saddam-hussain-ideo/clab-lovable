
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface ReferralProcessorProps {
  userId: string;
  addDebugMessage: (message: string) => void;
}

export const ReferralProcessor = ({ userId, addDebugMessage }: ReferralProcessorProps) => {
  const { toast } = useToast();
  
  useEffect(() => {
    const processReferral = async () => {
      try {
        addDebugMessage(`Starting referral processing for user ${userId}`);
        
        // Try multiple sources for the referral code:
        // 1. User metadata from OAuth/signup
        // 2. LocalStorage from previous page visit
        // 3. URL parameter if still in query string
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          addDebugMessage(`Error fetching user data: ${userError.message}`);
          return;
        }
        
        let referralCode = userData?.user?.user_metadata?.referral_code as string | undefined;
        addDebugMessage(`Referral code from user metadata: ${referralCode || 'none'}`);
        
        if (!referralCode) {
          referralCode = localStorage.getItem('pendingReferralCode');
          addDebugMessage(`Checking localStorage for referral code: ${referralCode || 'none found'}`);
        }
        
        if (!referralCode) {
          // Check URL for ref parameter
          const urlParams = new URLSearchParams(window.location.search);
          referralCode = urlParams.get('ref');
          addDebugMessage(`Checking URL for referral code: ${referralCode || 'none found'}`);
        }
        
        if (referralCode) {
          addDebugMessage(`Found referral code: ${referralCode}, processing...`);
          await handleReferralCode(referralCode, userId);
        } else {
          addDebugMessage('No referral code found from any source. Skipping referral processing.');
        }
      } catch (error: any) {
        addDebugMessage(`Unexpected error in processReferral: ${error.message || error}`);
      }
    };
    
    processReferral();
  }, [userId, addDebugMessage]);
  
  const handleReferralCode = async (referralCode: string, currentUserId: string) => {
    addDebugMessage(`Found referral code: ${referralCode}, processing...`);
    
    try {
      // First check if current user already has a processed referral
      const { data: existingUserReferrals, error: existingUserError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', currentUserId);
        
      if (existingUserError) {
        addDebugMessage(`Error checking if user already has referrals: ${existingUserError.message}`);
      } else if (existingUserReferrals && existingUserReferrals.length > 0) {
        addDebugMessage(`User already has been referred. Existing referrals: ${existingUserReferrals.length}`);
        toast({
          title: "Referral Already Processed",
          description: "You've already been referred to our platform.",
        });
        localStorage.removeItem('pendingReferralCode');
        return;
      }
      
      // Get the referrer profile by referral code
      const { data: referrerData, error: referrerError } = await supabase
        .from('profiles')
        .select('id, points, username, email, referral_code')
        .eq('referral_code', referralCode)
        .maybeSingle();
      
      if (referrerError) {
        console.error("Error finding referrer:", referrerError);
        addDebugMessage(`Error finding referrer: ${referrerError.message}`);
        toast({
          title: "Referral Error",
          description: "Could not find the user who referred you. Points will not be awarded.",
          variant: "destructive",
        });
        return;
      }
      
      if (!referrerData?.id) {
        addDebugMessage(`No referrer found with code: ${referralCode}`);
        toast({
          title: "Invalid Referral Code",
          description: "The referral code provided was not found.",
          variant: "destructive",
        });
        return;
      }
      
      addDebugMessage(`Found referrer: ${referrerData.id}, Current points: ${referrerData.points || 0}`);
      
      // Prevent self-referrals
      if (referrerData.id === currentUserId) {
        addDebugMessage(`Self-referral attempt detected and blocked`);
        toast({
          title: "Invalid Referral",
          description: "You cannot refer yourself.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if referral already exists
      const { data: existingReferral, error: existingReferralError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrerData.id)
        .eq('referred_id', currentUserId)
        .maybeSingle();
        
      if (existingReferralError) {
        console.error("Error checking existing referrals:", existingReferralError);
        addDebugMessage(`Error checking existing referrals: ${existingReferralError.message}`);
      }
      
      if (existingReferral) {
        addDebugMessage(`Referral already exists, skipping creation`);
        return;
      }
      
      await createReferral(referrerData.id, currentUserId, addDebugMessage, toast);
      
      // Clear the pending referral code from localStorage
      localStorage.removeItem('pendingReferralCode');
    } catch (error: any) {
      console.error("Error processing referral:", error);
      addDebugMessage(`Unexpected error processing referral: ${error.message || error}`);
      toast({
        title: "Referral Error",
        description: "An unexpected error occurred while processing your referral.",
        variant: "destructive",
      });
    }
  };
  
  return null; // This component doesn't render anything
};

// Helper function to create referral with multiple fallback approaches
export const createReferral = async (
  referrerId: string, 
  referredId: string, 
  addDebugMessage: (message: string) => void,
  toast: any
) => {
  addDebugMessage(`Attempting to create referral from ${referrerId} to ${referredId}...`);
  
  // Method 1: Insert directly with client
  addDebugMessage('Method 1: Attempting direct insert with client...');
  const { data: insertedReferral, error: insertError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrerId,
      referred_id: referredId
    })
    .select();
    
  if (insertError) {
    console.error("Error creating referral with client:", insertError);
    addDebugMessage(`Error creating referral with client: ${insertError.message}`);
    
    // Handle common RLS issues by checking error message
    if (insertError.message.includes('violates row-level security') || 
        insertError.message.includes('permission denied')) {
      addDebugMessage(`RLS policy violation detected, attempting different approach...`);
      
      try {
        // Method 2: Try Edge Function approach
        addDebugMessage('Method 2: Attempting to use create-referral edge function...');
        
        // Get the current user's JWT token for server-side operations
        const { data: authData } = await supabase.auth.getSession();
        const token = authData?.session?.access_token;
        
        if (token) {
          // API request to server-side Edge Function (which has service_role privileges)
          const { data, error } = await supabase.functions.invoke('create-referral', {
            body: {
              referrer_id: referrerId,
              referred_id: referredId
            }
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          addDebugMessage(`Edge function response: ${JSON.stringify(data)}`);
          
          if (data.success) {
            addDebugMessage(`Successfully created referral through edge function`);
            toast({
              title: "Referral Bonus!",
              description: "Both you and your referrer have earned 1,000 quiz points!",
            });
            return;
          } else {
            throw new Error(data.error || "Unknown error from edge function");
          }
        } else {
          throw new Error("No authentication token available");
        }
      } catch (edgeFunctionError: any) {
        console.error("Edge function error:", edgeFunctionError);
        addDebugMessage(`Edge function error: ${edgeFunctionError.message || edgeFunctionError}`);
        
        // Method 3: Fallback to direct point updates since referral creation failed
        addDebugMessage('Method 3: Fallback to manual point updates...');
        try {
          // Get current points for referrer
          const { data: currentReferrerData } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', referrerId)
            .single();
            
          // Get current points for referred user
          const { data: currentReferredData } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', referredId)
            .single();
          
          addDebugMessage(`Current referrer points: ${currentReferrerData?.points || 0}`);
          addDebugMessage(`Current referred user points: ${currentReferredData?.points || 0}`);
          
          // Manual point update for referrer
          const { error: referrerUpdateError } = await supabase
            .from('profiles')
            .update({ 
              points: (currentReferrerData?.points || 0) + 1000 
            })
            .eq('id', referrerId);
            
          if (referrerUpdateError) {
            addDebugMessage(`Error updating referrer points: ${referrerUpdateError.message}`);
          } else {
            addDebugMessage(`Successfully updated referrer points manually`);
          }
          
          // Manual point update for referred user
          const { error: referredUpdateError } = await supabase
            .from('profiles')
            .update({ 
              points: (currentReferredData?.points || 0) + 1000 
            })
            .eq('id', referredId);
            
          if (referredUpdateError) {
            addDebugMessage(`Error updating referred user points: ${referredUpdateError.message}`);
          } else {
            addDebugMessage(`Successfully updated referred user points manually`);
          
            toast({
              title: "Referral Bonus!",
              description: "You and your referrer have earned 1,000 quiz points!",
            });
          }
        } catch (pointUpdateError: any) {
          console.error("Error with manual point updates:", pointUpdateError);
          addDebugMessage(`Error with manual point updates: ${pointUpdateError.message || pointUpdateError}`);
        }
      }
    }
  } else {
    addDebugMessage(`Referral created successfully via direct insertion: ${JSON.stringify(insertedReferral)}`);
    toast({
      title: "Referral Bonus!",
      description: "Both you and your referrer have earned 1,000 quiz points!",
    });
  }
};
