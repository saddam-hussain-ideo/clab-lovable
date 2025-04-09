import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QuizCategory } from "@/lib/types/quiz";
import { markWalletQuestionAnswered } from "@/lib/services/walletProfileService";

export const useQuizQuestions = (limit = 5, category: QuizCategory | null) => {
  return useQuery({
    queryKey: ["quiz-questions", category],
    queryFn: async () => {
      if (!category) {
        throw new Error("No category selected");
      }

      // First get already answered questions for this user/wallet
      const { data: { session } } = await supabase.auth.getSession();
      const walletAddress = localStorage.getItem('walletAddress');
      
      let answeredQuestionIds: number[] = [];
      
      if (session?.user) {
        // Get answered questions from database for logged in users
        const { data: answeredQuestions } = await supabase
          .from('user_answered_questions')
          .select('question_id')
          .eq('user_id', session.user.id);
          
        answeredQuestionIds = answeredQuestions?.map(q => q.question_id) || [];
      } else if (walletAddress) {
        // For wallet users, get answered questions from localStorage and DB
        try {
          // Try to get from database first
          const { data: answeredQuestions } = await supabase
            .from('wallet_answered_questions')
            .select('question_id')
            .eq('wallet_address', walletAddress);
            
          answeredQuestionIds = answeredQuestions?.map(q => q.question_id) || [];
          console.log(`Found ${answeredQuestionIds.length} answered questions for wallet ${walletAddress} in DB`);
          
          // If no data in DB, check localStorage (backward compatibility)
          if (answeredQuestionIds.length === 0) {
            const answeredKey = `answered_questions_${walletAddress}`;
            const answered = localStorage.getItem(answeredKey);
            try {
              const localAnswered = answered ? JSON.parse(answered) : [];
              if (Array.isArray(localAnswered)) {
                answeredQuestionIds = localAnswered;
                console.log(`Found ${answeredQuestionIds.length} answered questions for wallet ${walletAddress} in localStorage`);
              }
            } catch (e) {
              console.error("Error parsing answered questions:", e);
            }
          }
        } catch (e) {
          console.error("Error fetching wallet answered questions:", e);
        }
      }

      console.log("Answered question IDs:", answeredQuestionIds);

      // Get all questions for this category
      let query = supabase
        .from("quiz_questions")
        .select("*")
        .eq("category", category);

      // If we want to limit results
      if (limit) {
        query = query.limit(limit);
      }

      // If there are answered questions, first try to get unanswered ones
      if (answeredQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`);
      }

      const { data: questions, error } = await query;

      if (error) {
        console.error("Error fetching questions:", error);
        throw error;
      }

      console.log(`Fetched ${questions?.length || 0} questions for category ${category}`);

      // If no new questions are available, reset answered questions and fetch all
      let finalQuestions = questions || [];
      if (!questions || questions.length === 0) {
        console.log("No new questions available, resetting tracking");
        
        if (session?.user) {
          // Delete answered questions records for this user
          await supabase
            .from('user_answered_questions')
            .delete()
            .eq('user_id', session.user.id);
        } else if (walletAddress) {
          // Clear localStorage tracking for this category
          localStorage.removeItem(`answered_questions_${walletAddress}`);
          
          // Clear database tracking
          await supabase
            .from('wallet_answered_questions')
            .delete()
            .eq('wallet_address', walletAddress);
        }
        
        // Fetch all questions again
        const { data: allQuestions } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("category", category)
          .limit(limit);
          
        if (allQuestions && allQuestions.length > 0) {
          finalQuestions = allQuestions;
        }
      }

      // Map the questions to the expected format
      return finalQuestions.map((q: any) => {
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
          console.error("Could not determine correct answer for question:", q.id);
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
    },
    enabled: !!category
  });
};

export const markQuestionAsAnswered = async (questionId: number, category?: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const walletAddress = localStorage.getItem('walletAddress');
    
    if (session?.user) {
      console.log(`Marking question ${questionId} as answered for user ${session.user.id}`);
      
      // Try direct insert first for more reliable operation
      const { error: directError } = await supabase
        .from('user_answered_questions')
        .insert({
          user_id: session.user.id,
          question_id: questionId
        });
        
      if (directError) {
        console.error("Error in direct insert for user answered question:", directError);
        // Only continue if not a unique constraint violation
        if (directError.code !== '23505') {
          throw directError;
        }
      } else {
        console.log("Successfully recorded question as answered in database");
      }
      
      // Dispatch event for profile update
      setTimeout(() => {
        console.log("Dispatching question answered event for user profile update");
        window.dispatchEvent(new CustomEvent('questionAnswered', {
          detail: { userId: session.user.id, questionId, timestamp: new Date().toISOString() }
        }));
      
        // Also dispatch explicit question count update event
        window.dispatchEvent(new CustomEvent('questionCountUpdated', {
          detail: { userId: session.user.id, totalAnswered: null, timestamp: new Date().toISOString() }
        }));
      }, 100);
      
      return true;
    } else if (walletAddress) {
      try {
        // Direct insert for wallet_answered_questions
        const { error: directError } = await supabase
          .from('wallet_answered_questions')
          .insert({
            wallet_address: walletAddress,
            question_id: questionId
          });
          
        if (directError) {
          console.error("Error in direct insert for wallet answered question:", directError);
          // Only continue if not a unique constraint violation
          if (directError.code !== '23505') {
            throw directError;
          }
        } else {
          console.log(`Successfully recorded question ${questionId} as answered for wallet ${walletAddress}`);
        }
        
        // Also store in localStorage for redundancy
        const answeredKey = `answered_questions_${walletAddress}`;
        let answeredIds = [];
        try {
          const existingJson = localStorage.getItem(answeredKey);
          answeredIds = existingJson ? JSON.parse(existingJson) : [];
          if (!Array.isArray(answeredIds)) answeredIds = [];
        } catch (e) {
          console.error("Error parsing localStorage:", e);
        }
        
        if (!answeredIds.includes(questionId)) {
          answeredIds.push(questionId);
          localStorage.setItem(answeredKey, JSON.stringify(answeredIds));
          console.log(`Added question ${questionId} to localStorage (total: ${answeredIds.length})`);
        }
        
        // Force profile update with delay to allow database operations to complete
        setTimeout(() => {
          console.log("Dispatching events for wallet profile update");
          window.dispatchEvent(new CustomEvent('questionAnswered', {
            detail: { walletAddress, questionId, timestamp: new Date().toISOString() }
          }));
          
          window.dispatchEvent(new CustomEvent('questionCountUpdated', {
            detail: { 
              walletAddress,
              totalAnswered: answeredIds.length,
              timestamp: new Date().toISOString() 
            }
          }));
          
          // Also dispatch generic profile update event
          window.dispatchEvent(new CustomEvent('forceProfileUpdate', {
            detail: { timestamp: new Date().toISOString() }
          }));
        }, 100);
        
        return true;
      } catch (error) {
        console.error("Error marking wallet question as answered:", error);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error in markQuestionAsAnswered:", error);
    return false;
  }
};
