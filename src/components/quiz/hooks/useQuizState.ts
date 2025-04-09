import { useState } from "react";
import { QuizCategory } from "@/lib/types/quiz";
import { useQuizQuestions, markQuestionAsAnswered } from "@/hooks/useQuiz";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { POINTS_PER_CORRECT_ANSWER, PERFECT_SCORE_BONUS } from "../constants";
import { 
  markWalletQuestionAnswered, 
  recordWalletQuizAttempt 
} from "@/lib/services/walletProfileService";

export const useQuizState = (session: any, walletAddress: string | null) => {
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  
  const { data: questions, isLoading, error, refetch } = useQuizQuestions(5, selectedCategory);

  const updateUserPoints = async (earnedPoints: number) => {
    try {
      if (session?.user) {
        // For authenticated users, update points in the profiles table
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', session.user.id)
          .single();

        if (fetchError) throw fetchError;

        // Get current points, default to 0 if null
        const currentPoints = profile?.points || 0;
        
        // Calculate new points total
        const newPoints = currentPoints + earnedPoints;
        
        console.log(`Points update calculation: ${currentPoints} + ${earnedPoints} = ${newPoints}`);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', session.user.id);

        if (updateError) throw updateError;
        
        console.log(`Points updated in database: ${currentPoints} → ${newPoints}`);
        
        // Dispatch an event to notify components that quiz activity has been updated
        window.dispatchEvent(new CustomEvent('quizActivityUpdated'));
      } 
      else if (walletAddress) {
        // For wallet users, update points in the wallet_profiles table
        const { data: walletProfile, error: fetchError } = await supabase
          .from('wallet_profiles')
          .select('points')
          .eq('wallet_address', walletAddress)
          .maybeSingle();
          
        // Get current points, default to 0 if null
        const currentPoints = walletProfile?.points || 0;
        
        // Calculate new points total
        const newPoints = currentPoints + earnedPoints;
        
        console.log(`Wallet points update calculation: ${currentPoints} + ${earnedPoints} = ${newPoints}`);
        
        const { error: updateError } = await supabase
          .from('wallet_profiles')
          .update({ points: newPoints })
          .eq('wallet_address', walletAddress);
          
        if (updateError) {
          // If update fails, the wallet profile might not exist yet - try to insert
          const { error: insertError } = await supabase
            .from('wallet_profiles')
            .insert({
              wallet_address: walletAddress,
              username: `Wallet_${walletAddress.substring(0, 6)}`,
              points: earnedPoints
            });
            
          if (insertError) throw insertError;
        }
        
        console.log(`Wallet points updated in database: ${currentPoints} → ${newPoints}`);
        
        // Also update localStorage for compatibility
        try {
          const walletProfileKey = `wallet_profile_${walletAddress}`;
          let storedProfile: Record<string, any> = {};
          const profileString = localStorage.getItem(walletProfileKey);
          
          if (profileString) {
            storedProfile = JSON.parse(profileString);
          }
          
          const updatedProfile = {
            ...storedProfile,
            id: storedProfile.id || crypto.randomUUID(),
            username: storedProfile.username || `Wallet_${walletAddress.substring(0, 6)}`,
            wallet_address: walletAddress,
            points: (storedProfile.points || 0) + earnedPoints,
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem(walletProfileKey, JSON.stringify(updatedProfile));
        } catch (error) {
          console.error('Error updating wallet points in localStorage:', error);
        }
        
        // Dispatch an event to notify components that quiz activity has been updated
        window.dispatchEvent(new CustomEvent('quizActivityUpdated'));
      }

      toast({
        title: "Points Earned!",
        description: `You earned ${earnedPoints} points!`,
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error updating points:', error);
      toast({
        title: "Error",
        description: "Failed to update points"
      });
    }
  };

  const trackQuizAttempt = async (correctAnswers: number, questionsAnswered: number) => {
    console.log(`Recording quiz attempt: ${correctAnswers}/${questionsAnswered} correct`);
    
    if (session?.user) {
      // For authenticated users, record in quiz_attempts table
      const isPerfectRound = correctAnswers === questionsAnswered && questionsAnswered > 0;
      const perfectRoundCount = isPerfectRound ? 1 : 0;
      
      const scorePercentage = questionsAnswered > 0
        ? Math.round((correctAnswers / questionsAnswered) * 100)
        : 0;
      
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .insert({
            user_id: session.user.id,
            score: scorePercentage,
            questions_answered: questionsAnswered,
            correct_answers: correctAnswers,
            perfect_rounds: perfectRoundCount,
            completed_at: new Date().toISOString()
          })
          .select();
        
        if (error) {
          console.error('Error recording quiz attempt to database:', error);
        } else {
          console.log('Quiz attempt recorded successfully to database:', data);
          
          // Trigger event after successful recording
          window.dispatchEvent(new CustomEvent('quizActivityUpdated'));
        }
      } catch (error) {
        console.error('Failed to record quiz attempt to database:', error);
      }
    } 
    else if (walletAddress) {
      try {
        const isPerfectRound = correctAnswers === questionsAnswered && questionsAnswered > 0;
        const perfectRoundCount = isPerfectRound ? 1 : 0;
        
        const scorePercentage = questionsAnswered > 0
          ? Math.round((correctAnswers / questionsAnswered) * 100)
          : 0;
        
        // Record attempt in wallet_quiz_attempts using our function
        const attemptId = await recordWalletQuizAttempt(
          walletAddress,
          scorePercentage,
          questionsAnswered,
          correctAnswers,
          perfectRoundCount
        );
        
        if (attemptId) {
          console.log(`Wallet quiz attempt recorded to database with ID: ${attemptId}`);
          
          // Trigger event after successful recording
          window.dispatchEvent(new CustomEvent('quizActivityUpdated'));
        }
        
        // Also record in localStorage for backward compatibility
        const attemptsKey = `quiz_attempts_${walletAddress}`;
        
        let attempts = [];
        try {
          const attemptsString = localStorage.getItem(attemptsKey);
          attempts = attemptsString ? JSON.parse(attemptsString) : [];
          if (!Array.isArray(attempts)) attempts = [];
        } catch (e) {
          console.error('Error parsing quiz attempts:', e);
          attempts = [];
        }
        
        const newAttempt = {
          id: Date.now(),
          score: scorePercentage,
          questions_answered: questionsAnswered,
          correct_answers: correctAnswers,
          perfect_rounds: perfectRoundCount,
          completed_at: new Date().toISOString()
        };
        
        attempts.push(newAttempt);
        
        const recentAttempts = attempts.slice(-20);
        localStorage.setItem(attemptsKey, JSON.stringify(recentAttempts));
      } catch (error) {
        console.error('Error recording wallet user quiz attempt:', error);
      }
    }
  };

  const handleCategorySelect = async (category: QuizCategory) => {
    // Modified check to consider EITHER session user OR wallet address as authenticated
    const isAuthenticated = !!session?.user || !!walletAddress;
    
    console.log("Quiz: Authentication check - Session:", !!session?.user, "Wallet:", !!walletAddress);
    
    if (!isAuthenticated) {
      console.log("Quiz: User not authenticated, showing signup prompt");
      setShowAuthDialog(true);
      return;
    }

    console.log("Quiz: User is authenticated, starting quiz with category:", category);
    
    try {
      setSelectedCategory(category);
      setCurrentQuestionIndex(0);
      setScore(0);
      setCorrectAnswers(0);
      console.log("Selected category:", category);
      await refetch();
    } catch (error) {
      console.error("Error handling category select:", error);
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again."
      });
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!questions) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    try {
      // Always mark the question as answered, regardless of correctness
      const success = await markQuestionAsAnswered(currentQuestion.id);
      
      if (!success) {
        console.warn(`Warning: Failed to mark question ${currentQuestion.id} as answered. This may cause duplicate questions.`);
      }
    } catch (error) {
      console.error('Error marking question as answered:', error);
    }

    if (isCorrect) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
      
      // Award exactly POINTS_PER_CORRECT_ANSWER points for each correct answer
      // We don't need to await this as it can happen in the background
      console.log(`Awarding ${POINTS_PER_CORRECT_ANSWER} points for correct answer`);
      updateUserPoints(POINTS_PER_CORRECT_ANSWER);
    }
    
    // Trigger an event that a question was answered
    window.dispatchEvent(new CustomEvent('questionAnswered'));
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    
    if (currentQuestionIndex === questions!.length - 1) {
      trackQuizAttempt(correctAnswers, questions!.length);
      
      // Only award perfect round bonus if all questions were answered correctly
      if (correctAnswers === questions!.length) {
        console.log(`Awarding perfect round bonus: ${PERFECT_SCORE_BONUS} points`);
        updateUserPoints(PERFECT_SCORE_BONUS);
      }
    }
  };

  const handleRestart = () => {
    setSelectedCategory(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
  };

  return {
    selectedCategory,
    currentQuestionIndex,
    score,
    correctAnswers,
    showAuthDialog,
    showPremiumDialog,
    questions,
    isLoading,
    error,
    setShowAuthDialog,
    setShowPremiumDialog,
    handleCategorySelect,
    handleAnswer,
    handleNext,
    handleRestart,
    refetch,
  };
};
