
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QuizQuestion, QuizCategory } from "@/lib/types/quiz";
import { toast } from "@/hooks/use-toast";

export const useQuizQuestions = (amount: number = 5, category?: QuizCategory) => {
  return useQuery({
    queryKey: ["quiz-questions", amount, category],
    queryFn: async () => {
      try {
        console.log("[useQuizQuestions] Fetching quiz questions...", { amount, category });
        
        const { data: { session } } = await supabase.auth.getSession();
        const walletAddress = localStorage.getItem('walletAddress');
        
        // Check if either user is authenticated via session OR has a wallet connected
        if (!session?.user && !walletAddress) {
          console.log("[useQuizQuestions] No user session or wallet found");
          throw new Error("User must be authenticated or wallet must be connected to fetch questions");
        }

        // First get the IDs of questions the user has already answered
        let answeredQuestionIds: number[] = [];
        
        if (session?.user) {
          console.log("[useQuizQuestions] Fetching answered questions for user:", session.user.id);
          const { data: answeredQuestions, error: answeredError } = await supabase
            .from('user_answered_questions')
            .select('question_id')
            .eq('user_id', session.user.id);

          if (answeredError) {
            console.error("[useQuizQuestions] Error fetching answered questions:", answeredError);
            throw answeredError;
          }

          answeredQuestionIds = answeredQuestions?.map(q => q.question_id) || [];
          console.log(`[useQuizQuestions] Found ${answeredQuestionIds.length} answered questions in database for user`);
        } else if (walletAddress) {
          // For wallet users, check both database and localStorage
          console.log("[useQuizQuestions] Fetching answered questions for wallet:", walletAddress);
          
          // First check the database
          const { data: dbAnsweredQuestions, error: dbError } = await supabase
            .from('wallet_answered_questions')
            .select('question_id')
            .eq('wallet_address', walletAddress);
            
          if (!dbError && dbAnsweredQuestions) {
            answeredQuestionIds = dbAnsweredQuestions.map(q => q.question_id);
            console.log(`[useQuizQuestions] Found ${answeredQuestionIds.length} answered questions in database for wallet`);
          } else if (dbError) {
            console.error("[useQuizQuestions] Error fetching wallet answered questions:", dbError);
          }
          
          // Then check localStorage for backward compatibility
          const possibleKeys = [
            `answered_questions_${walletAddress}`,
            `answered_questions_${category}_${walletAddress}`,
            `${category}_answered_questions_${walletAddress}`
          ];
          
          let localStorageIds: number[] = [];
          for (const key of possibleKeys) {
            try {
              const answered = localStorage.getItem(key);
              if (answered) {
                const parsedIds = JSON.parse(answered);
                if (Array.isArray(parsedIds) && parsedIds.length > 0) {
                  localStorageIds = [...localStorageIds, ...parsedIds];
                  console.log(`[useQuizQuestions] Found ${parsedIds.length} answered questions in localStorage key ${key}`);
                }
              }
            } catch (e) {
              console.error(`[useQuizQuestions] Error parsing localStorage for key ${key}:`, e);
            }
          }
          
          // Combine database and localStorage IDs
          if (localStorageIds.length > 0) {
            answeredQuestionIds = [...new Set([...answeredQuestionIds, ...localStorageIds])];
            console.log(`[useQuizQuestions] Combined with localStorage, total answered questions: ${answeredQuestionIds.length}`);
          }
        }
        
        console.log("[useQuizQuestions] Total unique answered questions:", answeredQuestionIds.length);

        // Build the query for new questions
        let questionsQuery = supabase
          .from('quiz_questions')
          .select('*');
          
        // Add category filter if specified
        if (category) {
          console.log("[useQuizQuestions] Filtering by category:", category);
          questionsQuery = questionsQuery.eq('category', category);
        }

        // Fetch all questions for this category
        const { data: allQuestions, error: allQuestionsError } = await questionsQuery;
        
        if (allQuestionsError) {
          console.error("[useQuizQuestions] Error fetching all questions:", allQuestionsError);
          throw allQuestionsError;
        }
        
        if (!allQuestions || allQuestions.length === 0) {
          console.log("[useQuizQuestions] No questions found for category:", category);
          return [];
        }
        
        console.log(`[useQuizQuestions] Found ${allQuestions.length} total questions for category ${category}`);
        
        // Filter out already answered questions
        let availableQuestions = allQuestions;
        if (answeredQuestionIds.length > 0) {
          availableQuestions = allQuestions.filter(q => !answeredQuestionIds.includes(q.id));
          console.log(`[useQuizQuestions] ${availableQuestions.length} questions available after filtering out answered ones`);
        }

        // If we don't have enough new questions, reset and use all questions
        if (availableQuestions.length < amount) {
          console.log("[useQuizQuestions] Not enough new questions, resetting tracking...");
          
          try {
            // Reset answered questions through the edge function
            if (session?.user || walletAddress) {
              const resetResponse = await supabase.functions.invoke('reset-quiz-questions', {
                body: { 
                  category, 
                  userId: session?.user?.id || null,
                  walletAddress: session?.user ? null : walletAddress
                }
              });
              
              if (resetResponse.error) {
                console.error("[useQuizQuestions] Error resetting questions via edge function:", resetResponse.error);
              } else {
                console.log("[useQuizQuestions] Successfully reset answered questions via edge function:", resetResponse.data);
              }
            }
          } catch (resetError) {
            console.error("[useQuizQuestions] Error calling reset-quiz-questions function:", resetError);
            
            // If edge function fails, fallback to localStorage cleanup for wallet users
            if (walletAddress) {
              try {
                // Clear localStorage tracking for all possible keys
                const keysToReset = [
                  `answered_questions_${walletAddress}`,
                  `answered_questions_${category}_${walletAddress}`,
                  `${category}_answered_questions_${walletAddress}`
                ];
                
                keysToReset.forEach(key => {
                  try {
                    localStorage.removeItem(key);
                    console.log(`[useQuizQuestions] Cleared localStorage key: ${key}`);
                  } catch (e) {
                    console.error(`[useQuizQuestions] Error clearing localStorage key ${key}:`, e);
                  }
                });
              } catch (localStorageError) {
                console.error("[useQuizQuestions] Error clearing localStorage:", localStorageError);
              }
            }
          }
          
          // Use all questions now that we've reset
          availableQuestions = allQuestions;
        }
        
        // Shuffle all questions randomly
        const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
        
        // Pick only the amount needed
        const selected = shuffled.slice(0, amount);
        console.log("[useQuizQuestions] Returning questions:", {
          count: selected.length,
          category,
          questionIds: selected.map(q => q.id)
        });
        
        // Format the questions
        return selected.map(q => {
          // Parse options if stored as a string
          const options = typeof q.options === 'string' 
            ? JSON.parse(q.options) 
            : Array.isArray(q.options) 
              ? q.options 
              : [];
          
          // Determine correct answer
          let correctAnswer;
          if (typeof q.correct_option === 'number' && options[q.correct_option]) {
            correctAnswer = options[q.correct_option];
          } else if (typeof q.correct_option === 'string') {
            correctAnswer = q.correct_option;
          } else {
            console.error("[useQuizQuestions] Could not determine correct answer for question:", q.id);
            correctAnswer = "Unknown";
          }

          return {
            id: q.id,
            text: q.text,
            question: q.text || q.question,
            options: options,
            correct_option: q.correct_option,
            correct_answer: correctAnswer,
            premium: q.premium || false,
            category: q.category
          };
        });
      } catch (error) {
        console.error("[useQuizQuestions] Error fetching quiz questions:", error);
        throw error;
      }
    },
    staleTime: 0, // Always consider data stale to force refetch
    gcTime: 0, // Don't cache this query
    refetchOnMount: true,
  });
};

// Enhanced function to reliably mark questions as answered
export const markQuestionAsAnswered = async (questionId: number) => {
  try {
    console.log("[markQuestionAsAnswered] Marking question as answered:", questionId);
    const { data: { session } } = await supabase.auth.getSession();
    const walletAddress = localStorage.getItem('walletAddress');
    
    if (!questionId) {
      console.error("[markQuestionAsAnswered] Invalid question ID:", questionId);
      return false;
    }
    
    let success = false;
    
    if (session?.user) {
      console.log("[markQuestionAsAnswered] Tracking question for session user:", session.user.id);
      // First try to insert into the database
      const { error } = await supabase
        .from('user_answered_questions')
        .insert({
          user_id: session.user.id,
          question_id: questionId
        });

      if (error && error.code !== '23505') { // Ignore duplicate key constraint
        console.error("[markQuestionAsAnswered] Error marking question as answered:", error);
        toast({
          title: "Error",
          description: "Failed to record quiz progress",
          variant: "destructive"
        });
      } else {
        console.log("[markQuestionAsAnswered] Question successfully marked as answered in database for user");
        success = true;
      }
    } else if (walletAddress) {
      console.log("[markQuestionAsAnswered] Tracking question for wallet user:", walletAddress);
      
      // Store in database first
      const { error } = await supabase
        .from('wallet_answered_questions')
        .insert({
          wallet_address: walletAddress,
          question_id: questionId
        });
        
      if (error && error.code !== '23505') { // Ignore duplicate key constraint
        console.error("[markQuestionAsAnswered] Error storing question in database:", error);
        toast({
          title: "Error",
          description: "Failed to record quiz progress",
          variant: "destructive"
        });
      } else {
        console.log("[markQuestionAsAnswered] Question successfully marked as answered in database for wallet");
        success = true;
      }
      
      // For wallet users, also store in localStorage for backward compatibility
      try {
        // Store in multiple possible localStorage keys for maximum compatibility
        const answeredKeys = [
          `answered_questions_${walletAddress}`,
          `answered_questions_all_${walletAddress}`
        ];
        
        for (const answeredKey of answeredKeys) {
          let answeredList = [];
          const answered = localStorage.getItem(answeredKey);
          if (answered) {
            answeredList = JSON.parse(answered);
            if (!Array.isArray(answeredList)) {
              answeredList = [];
            }
          }
          
          if (!answeredList.includes(questionId)) {
            answeredList.push(questionId);
            localStorage.setItem(answeredKey, JSON.stringify(answeredList));
            console.log(`[markQuestionAsAnswered] Question marked as answered in localStorage key ${answeredKey}:`, questionId);
          }
        }
      } catch (e) {
        console.error("[markQuestionAsAnswered] Error updating wallet answered questions in localStorage:", e);
        // If parse fails, start fresh
        localStorage.setItem(`answered_questions_${walletAddress}`, JSON.stringify([questionId]));
      }
    } else {
      console.error("[markQuestionAsAnswered] No user session or wallet found when marking question as answered");
      return false;
    }

    return success;
  } catch (error) {
    console.error("[markQuestionAsAnswered] Failed to mark question as answered:", error);
    return false;
  }
};

export const useQuizStats = (userId: string) => {
  return useQuery({
    queryKey: ["quiz-stats", userId],
    queryFn: async () => {
      try {
        console.log("Fetching quiz stats for user:", userId);
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error fetching quiz stats:", error);
          throw error;
        }

        console.log("Quiz stats fetched:", data?.length || 0);
        return data[0];
      } catch (error) {
        console.error("Error fetching quiz stats:", error);
        throw error;
      }
    },
  });
};
