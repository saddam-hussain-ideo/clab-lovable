
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';
import { useQuery } from '@tanstack/react-query';
import { getAnsweredQuestionsCount } from '@/lib/services/walletProfileService';

export interface QuizActivityStats {
  totalQuestionsAnswered: number;
  totalPointsEarned: number;
  perfectRounds: number;
  quizAttempts: QuizAttempt[];
  isLoading: boolean;
  refetch: () => void;
}

export interface QuizAttempt {
  id: number;
  score: number;
  questions_answered: number;
  correct_answers: number;
  perfect_rounds: number;
  completed_at: string;
}

export const useQuizActivity = (profile: Profile | null): QuizActivityStats => {
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [perfectRounds, setPerfectRounds] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const isRefreshingRef = useRef(false);
  const lastProfileIdRef = useRef<string | null>(null);
  
  // Log the profile received by this hook
  console.log('[useQuizActivity] Hook called with profile:', profile);
  
  // Specifically fetch questions count directly
  const fetchQuestionsCount = useCallback(async () => {
    if (!profile) return 0;
    
    try {
      console.log(`[useQuizActivity] Directly fetching question count for ${profile.id ? 'user' : 'wallet'}`);
      const count = await getAnsweredQuestionsCount(
        profile.wallet_address || undefined,
        profile.id || undefined
      );
      
      console.log(`[useQuizActivity] Direct question count result: ${count}`);
      return count;
    } catch (err) {
      console.error('[useQuizActivity] Error fetching question count:', err);
      return 0;
    }
  }, [profile]);
  
  // Handle direct fetch of metrics with better error handling
  const fetchMetricsDirectly = useCallback(async () => {
    if (!profile) {
      console.log('[useQuizActivity] No profile provided for fetching metrics');
      return null;
    }
    
    if (isRefreshingRef.current) {
      console.log(`[useQuizActivity] Already refreshing, skipping duplicate fetch`);
      return null;
    }
    
    isRefreshingRef.current = true;
    console.log('[useQuizActivity] Fetching metrics directly...');
    
    try {
      console.log(`[useQuizActivity] Direct DB fetch for ${profile.id ? 'user' : 'wallet'}: ${profile.id || profile.wallet_address}`);
      
      // First priority: get questions count directly
      const questionsCount = await fetchQuestionsCount();
      
      let points = 0;
      let perfRounds = 0;
      
      if (profile.id) {
        // Get profile points
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', profile.id)
          .maybeSingle();
          
        if (!profileError && profileData && profileData.points !== null) {
          points = profileData.points;
        }
        
        // Get perfect rounds
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('perfect_rounds')
          .eq('user_id', profile.id);
          
        if (!attemptsError && attemptsData && attemptsData.length > 0) {
          perfRounds = attemptsData.reduce((sum, record) => sum + (record.perfect_rounds || 0), 0);
        }
      } else if (profile.wallet_address) {
        // Get wallet profile points
        const { data: walletData, error: walletError } = await supabase
          .from('wallet_profiles')
          .select('points')
          .eq('wallet_address', profile.wallet_address)
          .maybeSingle();
          
        if (!walletError && walletData && walletData.points !== null) {
          points = walletData.points;
        }
        
        // Get perfect rounds
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('wallet_quiz_attempts')
          .select('perfect_rounds')
          .eq('wallet_address', profile.wallet_address);
          
        if (!attemptsError && attemptsData && attemptsData.length > 0) {
          perfRounds = attemptsData.reduce((sum, record) => sum + (record.perfect_rounds || 0), 0);
        }
      }
      
      console.log('[useQuizActivity] Direct metrics fetch results:', {
        questionsCount,
        points,
        perfRounds
      });
      
      // Always use the profile points if available and greater than zero
      if ((points === 0 || points === null) && profile.points > 0) {
        points = profile.points;
        console.log(`[useQuizActivity] Using profile.points instead: ${points}`);
      }
      
      isRefreshingRef.current = false;
      return {
        totalQuestionsAnswered: questionsCount,
        totalPointsEarned: points,
        perfectRounds: perfRounds
      };
    } catch (err) {
      console.error('[useQuizActivity] Error in direct metrics fetch:', err);
      isRefreshingRef.current = false;
      return null;
    }
  }, [profile, fetchQuestionsCount]);
  
  // When profile changes, immediately fetch metrics
  useEffect(() => {
    const profileIdentifier = profile?.id || profile?.wallet_address;
    const prevProfileIdentifier = lastProfileIdRef.current;
    
    if (profileIdentifier && profileIdentifier !== prevProfileIdentifier) {
      lastProfileIdRef.current = profileIdentifier;
      console.log('[useQuizActivity] Profile changed to:', profileIdentifier);
      
      // When profile changes, immediately fetch metrics and question count
      fetchMetricsDirectly().then(metrics => {
        if (metrics) {
          setTotalQuestionsAnswered(metrics.totalQuestionsAnswered);
          setTotalPointsEarned(metrics.totalPointsEarned);
          setPerfectRounds(metrics.perfectRounds);
        }
      });
      
      // Specifically fetch just the questions count as a backup
      fetchQuestionsCount().then(count => {
        if (count > 0) {
          console.log(`[useQuizActivity] Setting question count from direct fetch: ${count}`);
          setTotalQuestionsAnswered(count);
        }
      });
    }
    
    // Set initial points from profile immediately
    if (profile?.points && profile.points > 0 && totalPointsEarned === 0) {
      console.log(`[useQuizActivity] Setting initial points from profile: ${profile.points}`);
      setTotalPointsEarned(profile.points);
    }
  }, [profile, fetchMetricsDirectly, fetchQuestionsCount, totalPointsEarned]);
  
  // Listen for events
  useEffect(() => {
    const handleQuizActivityUpdate = () => {
      console.log('[useQuizActivity] Received quizActivityUpdated event, refreshing metrics');
      fetchMetricsDirectly().then(metrics => {
        if (metrics) {
          setTotalQuestionsAnswered(metrics.totalQuestionsAnswered);
          setTotalPointsEarned(metrics.totalPointsEarned);
          setPerfectRounds(metrics.perfectRounds);
        }
      });
    };
    
    // Listen specifically for question count updates
    const handleQuestionCountUpdate = (e: any) => {
      const { userId, walletAddress, totalAnswered } = e.detail || {};
      console.log('[useQuizActivity] Received questionCountUpdated event:', e.detail);
      
      if (totalAnswered !== undefined) {
        if ((userId && profile?.id === userId) || 
            (walletAddress && profile?.wallet_address === walletAddress)) {
          console.log(`[useQuizActivity] Updating questions count to ${totalAnswered}`);
          setTotalQuestionsAnswered(totalAnswered);
        }
      }
    };
    
    window.addEventListener('quizActivityUpdated', handleQuizActivityUpdate);
    window.addEventListener('questionCountUpdated', handleQuestionCountUpdate);
    
    return () => {
      window.removeEventListener('quizActivityUpdated', handleQuizActivityUpdate);
      window.removeEventListener('questionCountUpdated', handleQuestionCountUpdate);
    };
  }, [profile, fetchMetricsDirectly]);
  
  // Main query to fetch attempts and stats if not obtained via direct means
  const { 
    data: quizAttempts = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['quiz-activity', profile?.id, profile?.wallet_address],
    queryFn: async () => {
      if (!profile) {
        console.log("[useQuizActivity] No profile provided, returning empty data");
        return [];
      }
      
      if (isRefreshingRef.current) {
        console.log(`[useQuizActivity] Already refreshing, skipping duplicate fetch in queryFn`);
        return [];
      }
      
      isRefreshingRef.current = true;
      
      try {
        console.log("[useQuizActivity] Fetching quiz activity for profile:", {
          id: profile.id,
          username: profile.username,
          wallet: profile.wallet_address,
          points: profile.points
        });
        
        // Try direct fetch from the appropriate table based on user type
        let attempts: QuizAttempt[] = [];
        
        if (profile.id) {
          // First try get_user_quiz_activity function
          try {
            const { data, error } = await supabase.rpc('get_user_quiz_activity', {
              p_user_id: profile.id,
              p_wallet_address: null
            });
            
            if (!error && data && data.length > 0) {
              attempts = data[0].attempts || [];
              
              const newQuestionsAnswered = data[0].total_questions_answered || 0;
              const newPointsEarned = data[0].total_points_earned || profile.points || 0;
              const newPerfectRounds = data[0].perfect_rounds || 0;
              
              setTotalQuestionsAnswered(newQuestionsAnswered);
              setTotalPointsEarned(newPointsEarned);
              setPerfectRounds(newPerfectRounds);
              
              console.log("[useQuizActivity] RPC function returned metrics:", {
                questions: newQuestionsAnswered,
                points: newPointsEarned,
                perfectRounds: newPerfectRounds,
                attemptsCount: attempts.length
              });
              
              isRefreshingRef.current = false;
              return attempts;
            }
          } catch (rpcError) {
            console.error("[useQuizActivity] RPC function error:", rpcError);
          }
          
          // Fallback to direct query if RPC fails
          const { data: attemptData, error: attemptError } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('user_id', profile.id)
            .order('completed_at', { ascending: false })
            .limit(10);
            
          if (!attemptError && attemptData) {
            attempts = attemptData;
            console.log(`[useQuizActivity] Found ${attempts.length} attempts for user`);
          } else {
            console.error('[useQuizActivity] Error fetching attempts:', attemptError);
          }
        } else if (profile.wallet_address) {
          // First try get_user_quiz_activity function for wallet
          try {
            const { data, error } = await supabase.rpc('get_user_quiz_activity', {
              p_user_id: null,
              p_wallet_address: profile.wallet_address
            });
            
            if (!error && data && data.length > 0) {
              attempts = data[0].attempts || [];
              
              const newQuestionsAnswered = data[0].total_questions_answered || 0;
              const newPointsEarned = data[0].total_points_earned || profile.points || 0;
              const newPerfectRounds = data[0].perfect_rounds || 0;
              
              setTotalQuestionsAnswered(newQuestionsAnswered);
              setTotalPointsEarned(newPointsEarned);
              setPerfectRounds(newPerfectRounds);
              
              console.log("[useQuizActivity] RPC function returned wallet metrics:", {
                questions: newQuestionsAnswered,
                points: newPointsEarned,
                perfectRounds: newPerfectRounds,
                attemptsCount: attempts.length
              });
              
              isRefreshingRef.current = false;
              return attempts;
            }
          } catch (rpcError) {
            console.error("[useQuizActivity] RPC function error for wallet:", rpcError);
          }
          
          // Fallback to direct query if RPC fails
          const { data: attemptData, error: attemptError } = await supabase
            .from('wallet_quiz_attempts')
            .select('*')
            .eq('wallet_address', profile.wallet_address)
            .order('completed_at', { ascending: false })
            .limit(10);
            
          if (!attemptError && attemptData) {
            attempts = attemptData;
            console.log(`[useQuizActivity] Found ${attempts.length} attempts for wallet`);
          } else {
            console.error('[useQuizActivity] Error fetching wallet attempts:', attemptError);
          }
        }
        
        // If we couldn't get the data from the RPC function, try direct fetch
        const metrics = await fetchMetricsDirectly();
        if (metrics) {
          setTotalQuestionsAnswered(metrics.totalQuestionsAnswered);
          setTotalPointsEarned(metrics.totalPointsEarned);
          setPerfectRounds(metrics.perfectRounds);
          console.log("[useQuizActivity] Updated metrics from direct fetch");
        }
        
        isRefreshingRef.current = false;
        return attempts;
      } catch (error) {
        console.error('[useQuizActivity] Error in query function:', error);
        
        // Try direct metrics fetch as last resort
        try {
          const backupMetrics = await fetchMetricsDirectly();
          if (backupMetrics) {
            setTotalQuestionsAnswered(backupMetrics.totalQuestionsAnswered);
            setTotalPointsEarned(backupMetrics.totalPointsEarned);
            setPerfectRounds(backupMetrics.perfectRounds);
          }
        } catch (backupError) {
          console.error('[useQuizActivity] Backup fetch failed:', backupError);
        }
        
        isRefreshingRef.current = false;
        return [];
      }
    },
    enabled: !!profile,
    staleTime: 30000, // Reduce stale time to refresh more frequently
    refetchOnWindowFocus: true, // Enable refresh on window focus
    refetchOnMount: true,
    refetchOnReconnect: true, // Enable refresh on reconnect
  });
  
  // Handle manual refetch with better error handling
  const handleRefetch = async () => {
    console.log("[useQuizActivity] Manual refresh triggered");
    
    if (isRefreshingRef.current) {
      console.log("[useQuizActivity] Already refreshing, skipping manual refresh");
      return;
    }
    
    // Directly fetch questions count first - this is our priority
    const questionCount = await fetchQuestionsCount();
    if (questionCount > 0) {
      console.log(`[useQuizActivity] Setting question count from manual refresh: ${questionCount}`);
      setTotalQuestionsAnswered(questionCount);
    }
    
    // Try to fetch metrics directly 
    const metrics = await fetchMetricsDirectly();
    if (metrics) {
      setTotalQuestionsAnswered(metrics.totalQuestionsAnswered);
      setTotalPointsEarned(metrics.totalPointsEarned);
      setPerfectRounds(metrics.perfectRounds);
      console.log("[useQuizActivity] Metrics refreshed via direct fetch");
    }
    
    // Then trigger the regular refetch
    if (!isRefreshingRef.current) {
      refetch();
    }
  };
  
  // Ensure we always return the profile points if no other points are found
  const finalPoints = totalPointsEarned === 0 && profile?.points ? profile.points : totalPointsEarned;
  
  return {
    totalQuestionsAnswered,
    totalPointsEarned: finalPoints,
    perfectRounds,
    quizAttempts,
    isLoading,
    refetch: handleRefetch
  };
};
