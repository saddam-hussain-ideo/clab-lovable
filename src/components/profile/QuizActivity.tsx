
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizActivity } from "@/hooks/useQuizActivity";
import { Profile } from "@/types/profile";
import { BarChart, Calendar, Star, Award, RefreshCw, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfilePointsDisplay } from "./ProfilePointsDisplay";
import { getAnsweredQuestionsCount } from "@/lib/services/walletProfileService";
import { QuizActionPanel } from "./QuizActionPanel";
import { useQuizAccess } from "@/components/quiz/hooks/useQuizAccess";
import { supabase } from "@/lib/supabase";

interface QuizActivityProps {
  profile: Profile | null;
}

export const QuizActivity = ({
  profile
}: QuizActivityProps) => {
  const [displayPoints, setDisplayPoints] = useState(0);
  const [manualQuestionsCount, setManualQuestionsCount] = useState<number | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [hasPresaleContribution, setHasPresaleContribution] = useState(false);
  const [walletPoints, setWalletPoints] = useState<number | null>(null);
  
  console.log("[QuizActivity] Component rendering with profile:", profile);
  
  const {
    totalQuestionsAnswered,
    totalPointsEarned,
    perfectRounds,
    quizAttempts,
    isLoading,
    refetch
  } = useQuizActivity(profile);
  
  const storedWalletAddress = profile?.wallet_address || localStorage.getItem('walletAddress');
  
  const {
    hasUnlimitedAccess,
    attemptsRemaining,
    isLoading: accessLoading,
    refreshAccess
  } = useQuizAccess(storedWalletAddress, profile?.id || null);
  
  // Check for presale contributions
  useEffect(() => {
    const checkPresaleContributions = async () => {
      if (!profile) return;
      try {
        if (profile.wallet_address) {
          const {
            data: walletContributions,
            error: walletError
          } = await supabase.from('presale_contributions').select('id').eq('wallet_address', profile.wallet_address).limit(1);
          if (!walletError && walletContributions && walletContributions.length > 0) {
            console.log("[QuizActivity] Found presale contribution for wallet:", profile.wallet_address);
            setHasPresaleContribution(true);
            refreshAccess();
            return;
          }
        }
        if (profile.id) {
          const {
            data: userContributions,
            error: userError
          } = await supabase.from('presale_contributions').select('id').eq('user_id', profile.id).limit(1);
          if (!userError && userContributions && userContributions.length > 0) {
            console.log("[QuizActivity] Found presale contribution for user:", profile.id);
            setHasPresaleContribution(true);
            refreshAccess();
            return;
          }
        }
        console.log("[QuizActivity] No presale contributions found for user/wallet");
        setHasPresaleContribution(false);
      } catch (err) {
        console.error("[QuizActivity] Error checking presale contributions:", err);
      }
    };
    checkPresaleContributions();
  }, [profile, refreshAccess]);
  
  // Fetch wallet points if a wallet address is available - this works for all wallets
  useEffect(() => {
    const fetchWalletPoints = async () => {
      if (!storedWalletAddress) return;
      
      try {
        console.log(`[QuizActivity] Fetching wallet points for: ${storedWalletAddress}`);
        
        // Direct query to wallet_profiles for all wallets
        const { data: walletData, error: walletError } = await supabase
          .from('wallet_profiles')
          .select('points')
          .eq('wallet_address', storedWalletAddress)
          .maybeSingle();
        
        if (!walletError && walletData && typeof walletData.points === 'number') {
          console.log(`[QuizActivity] Found wallet points: ${walletData.points} for wallet: ${storedWalletAddress}`);
          setWalletPoints(walletData.points);
          
          // If we have wallet points, update the display points
          if (walletData.points > 0) {
            setDisplayPoints(walletData.points);
          }
        } else {
          // If no points in wallet_profiles, check quiz_attempts for direct calculation for all wallets
          const { data: attemptsData, error: attemptsError } = await supabase
            .from('wallet_quiz_attempts')
            .select('correct_answers, perfect_rounds')
            .eq('wallet_address', storedWalletAddress);
          
          if (!attemptsError && attemptsData && attemptsData.length > 0) {
            // Calculate points directly: 100 per correct answer + 1000 per perfect round
            const calculatedPoints = attemptsData.reduce((total, attempt) => {
              return total + 
                (attempt.correct_answers || 0) * 100 + 
                (attempt.perfect_rounds || 0) * 1000;
            }, 0);
            
            console.log(`[QuizActivity] Calculated points from attempts: ${calculatedPoints}`);
            
            if (calculatedPoints > 0) {
              setWalletPoints(calculatedPoints);
              setDisplayPoints(calculatedPoints);
            }
          } else {
            console.log(`[QuizActivity] No wallet points found for: ${storedWalletAddress}`);
            setWalletPoints(null);
          }
        }
      } catch (err) {
        console.error('[QuizActivity] Error fetching wallet points:', err);
      }
    };
    
    fetchWalletPoints();
  }, [storedWalletAddress, lastRefreshTime]);
  
  console.log("[QuizActivity] useQuizActivity returned:", {
    totalQuestionsAnswered,
    totalPointsEarned,
    perfectRounds,
    quizAttemptsLength: quizAttempts?.length || 0,
    isLoading,
    hasUnlimitedAccess,
    hasPresaleContribution,
    walletPoints
  });
  
  // Trigger initial data fetch
  useEffect(() => {
    if (profile) {
      console.log("[QuizActivity] Triggering initial data fetch for user:", profile.id);
      refetch();
      const fetchQuestionCount = async () => {
        try {
          const count = await getAnsweredQuestionsCount(profile.wallet_address || undefined, profile.id || undefined);
          console.log(`[QuizActivity] Direct question count fetch returned: ${count}`);
          setManualQuestionsCount(count);
        } catch (err) {
          console.error("[QuizActivity] Error fetching question count:", err);
        }
      };
      fetchQuestionCount();
    }
    
    // Set initial points from localStorage for all wallet users
    if (profile?.wallet_address) {
      try {
        const walletProfileKey = `wallet_profile_${profile.wallet_address}`;
        const storedProfile = localStorage.getItem(walletProfileKey);
        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          if (parsedProfile.points) {
            console.log(`[QuizActivity] Setting initial points from localStorage: ${parsedProfile.points}`);
            setDisplayPoints(parsedProfile.points);
          }
        }
      } catch (err) {
        console.error('[QuizActivity] Error reading from localStorage:', err);
      }
    } else if (profile?.points) {
      console.log(`[QuizActivity] Setting initial display points from profile: ${profile.points}`);
      setDisplayPoints(profile.points);
    }
  }, [profile, refetch]);
  
  // Combine points from both sources for all wallet users
  useEffect(() => {
    // For all wallet users, prioritize wallet points when available
    if (profile?.wallet_address && walletPoints && walletPoints > 0) {
      console.log('[QuizActivity] Prioritizing wallet points for wallet:', walletPoints);
      setDisplayPoints(walletPoints);
      return;
    }
    
    const profilePoints = profile?.points || 0;
    const earnedPoints = totalPointsEarned || 0;
    const extraWalletPoints = walletPoints || 0;
    
    // Use the highest value among all sources to ensure we don't lose any points
    // If the user is authenticated with both profile and wallet, we might be showing
    // the same points twice, but that's better than showing 0
    const combinedPoints = Math.max(profilePoints, earnedPoints, extraWalletPoints);
    
    // Only update if we have a higher value to prevent display flicker
    if (combinedPoints > displayPoints) {
      console.log("[QuizActivity] Updating display points from", displayPoints, "to", combinedPoints);
      setDisplayPoints(combinedPoints);
    }
  }, [totalPointsEarned, profile, walletPoints, displayPoints]);
  
  // Handle delayed refresh for missing data
  useEffect(() => {
    if (profile && (totalQuestionsAnswered === 0 || totalPointsEarned === 0) && !manualQuestionsCount) {
      const timer = setTimeout(() => {
        console.log("[QuizActivity] Triggering delayed refresh to ensure latest metrics");
        refetch();
        refreshAccess();
        const fetchQuestionCountAgain = async () => {
          try {
            const count = await getAnsweredQuestionsCount(profile.wallet_address || undefined, profile.id || undefined);
            console.log(`[QuizActivity] Delayed direct question count fetch returned: ${count}`);
            setManualQuestionsCount(count);
          } catch (err) {
            console.error("[QuizActivity] Error in delayed fetch:", err);
          }
        };
        fetchQuestionCountAgain();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [profile, totalQuestionsAnswered, totalPointsEarned, refetch, manualQuestionsCount, refreshAccess]);
  
  // Set up event listeners
  useEffect(() => {
    const handleQuizActivityUpdate = () => {
      console.log("[QuizActivity] Received quizActivityUpdated event, refreshing");
      refetch();
    };
    const handleQuestionCountUpdate = (event: CustomEvent) => {
      console.log("[QuizActivity] Received questionCountUpdated event", event.detail);
      if (profile) {
        getAnsweredQuestionsCount(profile.wallet_address || undefined, profile.id || undefined).then(count => {
          console.log(`[QuizActivity] Updated question count: ${count}`);
          setManualQuestionsCount(count);
        });
      }
      refetch();
      setLastRefreshTime(Date.now());
    };
    const handleForceProfileUpdate = () => {
      console.log("[QuizActivity] Received forceProfileUpdate event");
      setLastRefreshTime(Date.now());
      refetch();
      refreshAccess();
      if (profile) {
        getAnsweredQuestionsCount(profile.wallet_address || undefined, profile.id || undefined).then(count => {
          console.log(`[QuizActivity] Force updated question count: ${count}`);
          setManualQuestionsCount(count);
        });
      }
    };
    window.addEventListener('quizActivityUpdated', handleQuizActivityUpdate);
    window.addEventListener('questionCountUpdated', handleQuestionCountUpdate as EventListener);
    window.addEventListener('forceProfileUpdate', handleForceProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('quizActivityUpdated', handleQuizActivityUpdate);
      window.removeEventListener('questionCountUpdated', handleQuestionCountUpdate as EventListener);
      window.removeEventListener('forceProfileUpdate', handleForceProfileUpdate as EventListener);
    };
  }, [profile, refetch, refreshAccess, lastRefreshTime]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (profile) {
      toast.info("Refreshing quiz data...");
      console.log("[QuizActivity] Manual refresh triggered");
      try {
        // Fetch updated question count
        const count = await getAnsweredQuestionsCount(profile.wallet_address || undefined, profile.id || undefined);
        console.log(`[QuizActivity] Manual refresh question count: ${count}`);
        setManualQuestionsCount(count);
        
        // Fetch wallet points for all wallets
        if (storedWalletAddress) {
          const { data: walletData } = await supabase
            .from('wallet_profiles')
            .select('points')
            .eq('wallet_address', storedWalletAddress)
            .maybeSingle();
            
          if (walletData && typeof walletData.points === 'number') {
            console.log(`[QuizActivity] Updated wallet points: ${walletData.points}`);
            setWalletPoints(walletData.points);
            
            // For all wallet users, prioritize wallet points when available
            if (walletData.points > 0) {
              setDisplayPoints(walletData.points);
            }
          }
          
          // For all wallets, try direct calculation from quiz attempts when needed
          const { data: attemptsData, error: attemptsError } = await supabase
            .from('wallet_quiz_attempts')
            .select('correct_answers, perfect_rounds')
            .eq('wallet_address', storedWalletAddress);
          
          if (!attemptsError && attemptsData && attemptsData.length > 0) {
            const calculatedPoints = attemptsData.reduce((total, attempt) => {
              return total + 
                (attempt.correct_answers || 0) * 100 + 
                (attempt.perfect_rounds || 0) * 1000;
            }, 0);
            
            console.log(`[QuizActivity] Calculated points from attempts: ${calculatedPoints}`);
            
            if (calculatedPoints > 0) {
              setWalletPoints(calculatedPoints);
              setDisplayPoints(calculatedPoints);
              
              // Also update the database if the calculated points differ from what's stored
              if (walletData && calculatedPoints > walletData.points) {
                console.log(`[QuizActivity] Updating wallet profile with calculated points: ${calculatedPoints}`);
                await supabase
                  .from('wallet_profiles')
                  .update({ points: calculatedPoints })
                  .eq('wallet_address', storedWalletAddress);
              }
            }
          }
        }
        
        // Check presale contributions
        if (profile.wallet_address) {
          const {
            data: walletContributions
          } = await supabase.from('presale_contributions').select('id').eq('wallet_address', profile.wallet_address).limit(1);
          if (walletContributions && walletContributions.length > 0) {
            setHasPresaleContribution(true);
          }
        }
        if (profile.id) {
          const {
            data: userContributions
          } = await supabase.from('presale_contributions').select('id').eq('user_id', profile.id).limit(1);
          if (userContributions && userContributions.length > 0) {
            setHasPresaleContribution(true);
          }
        }
      } catch (err) {
        console.error("[QuizActivity] Error checking presale contributions:", err);
      }
      refetch();
      refreshAccess();
      setLastRefreshTime(Date.now());
      window.dispatchEvent(new CustomEvent('premium_status_updated'));
      window.dispatchEvent(new CustomEvent('presaleContributionUpdated'));
    } else {
      toast.error("Cannot refresh: No profile data available");
      console.log("[QuizActivity] Refresh failed - no profile");
    }
  };
  
  const displayQuestionsCount = manualQuestionsCount !== null ? manualQuestionsCount : totalQuestionsAnswered;
  const showUnlimitedAccess = hasUnlimitedAccess || hasPresaleContribution;
  
  if (!profile) {
    console.log("[QuizActivity] No profile provided, showing fallback UI");
    return <div className="p-8 text-center">
        <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-200 mb-2">Profile Not Available</h3>
        <p className="text-gray-400">Unable to load quiz activity without profile data.</p>
      </div>;
  }
  
  console.log("[QuizActivity] About to render main content:", {
    points: displayPoints,
    questionsAnswered: displayQuestionsCount,
    manualQuestionsCount,
    totalQuestionsAnswered,
    perfectRounds,
    attempts: quizAttempts?.length || 0,
    hasUnlimitedAccess: showUnlimitedAccess
  });
  
  return <div className="space-y-8">
      <QuizActionPanel profile={profile} totalQuestions={displayQuestionsCount} hasUnlimitedAccess={showUnlimitedAccess} attemptsRemaining={attemptsRemaining} />
      
      <ProfilePointsDisplay points={displayPoints} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900/60 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-gray-50">
              <Award className="mr-2 h-5 w-5 text-purple-500" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">
              {isLoading ? <Skeleton className="h-9 w-24" /> : displayPoints.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/60 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-gray-50">
              <BarChart className="mr-2 h-5 w-5 text-blue-500" />
              Questions Answered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {isLoading ? <Skeleton className="h-9 w-16" /> : displayQuestionsCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/60 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-gray-50">
              <Star className="mr-2 h-5 w-5 text-yellow-500" />
              Perfect Rounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">
              {isLoading ? <Skeleton className="h-9 w-12" /> : perfectRounds.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
