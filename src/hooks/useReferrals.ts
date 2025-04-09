
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Profile } from '@/types/profile';

export interface ReferralUser {
  id: string;
  referred_id: string;
  created_at: string;
  referred_user?: {
    username: string | null;
    email: string | null;
    created_at: string;
  } | null;
}

export const useReferrals = (profile: Profile | null) => {
  const { data: referrals = [], isError, error, refetch, isLoading } = useQuery<ReferralUser[]>({
    queryKey: ['referrals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      console.log("Fetching referrals for user:", profile.id);
      
      // Generate a referral code if none exists
      if (!profile.referral_code) {
        console.log("User has no referral code, generating one");
        
        try {
          const { data: codeData, error: codeError } = await supabase
            .rpc('generate_short_referral_code');
            
          if (codeError) {
            console.error("Error generating referral code via RPC:", codeError);
            
            // Fallback to generating a code client-side
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let randomCode = '';
            for (let i = 0; i < 8; i++) {
              randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({ referral_code: randomCode })
              .eq('id', profile.id)
              .select('referral_code')
              .single();
              
            if (updateError) {
              console.error("Error saving referral code:", updateError);
            } else {
              console.log("Generated new referral code:", updateData.referral_code);
              // Notify the user
              toast({
                title: "Referral Code Generated",
                description: "You can now invite friends to earn points!",
              });
            }
          } else {
            console.log("Generated new referral code via RPC:", codeData);
            
            const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({ referral_code: codeData })
              .eq('id', profile.id)
              .select('referral_code')
              .single();
              
            if (updateError) {
              console.error("Error saving RPC-generated referral code:", updateError);
            } else {
              console.log("Saved RPC-generated referral code:", updateData.referral_code);
              // Notify the user
              toast({
                title: "Referral Code Generated",
                description: "You can now invite friends to earn points!",
              });
            }
          }
        } catch (err) {
          console.error("Failed to generate referral code:", err);
        }
      }
      
      try {
        // First, debug: check if the user exists in the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, referral_code, points')
          .eq('id', profile.id)
          .single();
          
        if (profileError) {
          console.error("Error verifying profile:", profileError);
          throw new Error("Failed to verify profile");
        } else {
          console.log("Profile verified:", profileData);
        }
        
        // Get all referrals where this user is the referrer
        const { data: referralsData, error: referralsError } = await supabase
          .from('referrals')
          .select('id, referred_id, created_at')
          .eq('referrer_id', profile.id);
        
        if (referralsError) {
          console.error("Error fetching referrals:", referralsError);
          throw new Error("Failed to load referrals: " + referralsError.message);
        }
        
        console.log("Fetched basic referrals data:", referralsData);
        
        // Debug: directly check the referrals table to see all entries
        const { data: allReferrals, error: allRefError } = await supabase
          .from('referrals')
          .select('*');
          
        if (allRefError) {
          console.error("Error fetching all referrals:", allRefError);
        } else {
          console.log("All recent referrals in the database:", allReferrals);
        }
        
        // If no referrals found, return empty array early
        if (!referralsData || referralsData.length === 0) {
          return [];
        }
        
        // For each referral, get the referred user's profile information separately
        const formattedData = await Promise.all(
          referralsData.map(async (referral) => {
            try {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('username, email, created_at')
                .eq('id', referral.referred_id)
                .maybeSingle();
              
              if (userError) {
                console.error("Error fetching user data for referral:", userError);
                return {
                  ...referral,
                  referred_user: null
                };
              }
              
              return {
                ...referral,
                referred_user: userData
              };
            } catch (err) {
              console.error("Error processing referral user data:", err);
              return {
                ...referral,
                referred_user: null
              };
            }
          })
        );
        
        console.log("Processed referrals with user data:", formattedData);
        return formattedData as ReferralUser[];
      } catch (err) {
        console.error("Failed to fetch referrals:", err);
        throw err;
      }
    },
    enabled: !!profile?.id,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
  });

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load referrals",
        variant: "destructive",
      });
    }
  }, [isError, error]);

  return { referrals, isError, error, refetch, isLoading };
};
