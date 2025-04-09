import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Timer } from "lucide-react";
import { QuizContent } from "./QuizContent";
import { QuizLoading } from "./QuizLoading";
import { QuizError } from "./QuizError";
import { QuizCategory } from "@/lib/types/quiz";
import { usePremiumStatus } from "./hooks/usePremiumStatus";
import { useSession } from "@/lib/supabase";
import { PremiumAccessDialog } from "./PremiumAccessDialog";
import { toast } from "@/hooks/use-toast";
import { useQuizQuestions, markQuestionAsAnswered } from "@/hooks/useQuiz";
import { QuizResults } from "./QuizResults";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Question } from "./Question";
import { WalletModal } from "@/components/wallet/WalletModal";
import { SignUpPromptDialog } from "./SignUpPromptDialog";
import { supabase } from "@/lib/supabase";

const QUESTIONS_PER_ROUND = 5;
const POINTS_PER_CORRECT_ANSWER = 100;
const PERFECT_SCORE_BONUS = 500;

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategory: QuizCategory | null;
}

export const QuizModal = ({ open, onOpenChange, selectedCategory }: QuizModalProps) => {
  const session = useSession();
  const { isPremium } = usePremiumStatus(session, session?.user?.id || null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeRound, setActiveRound] = useState(0);
  const [lastLoadedCategory, setLastLoadedCategory] = useState<QuizCategory | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(localStorage.getItem('walletAddress'));
  const [reviewMode, setReviewMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  const { 
    data: allQuestions = [], 
    isLoading,
    isError,
    refetch
  } = useQuizQuestions(QUESTIONS_PER_ROUND, selectedCategory);
  
  const startIdx = activeRound * QUESTIONS_PER_ROUND;
  const questions = allQuestions.slice(startIdx, startIdx + QUESTIONS_PER_ROUND);
  const hasMoreRounds = (activeRound + 1) * QUESTIONS_PER_ROUND < allQuestions.length;

  const isAuthenticated = !!session?.user || !!walletAddress;

  useEffect(() => {
    if (selectedCategory) {
      if (isLoading) {
        return;
      }
      
      if (isError) {
        return;
      }
      
      if (!questions || questions.length === 0) {
        return;
      }
      
      if (selectedCategory !== lastLoadedCategory) {
        console.log(`[QuizModal] Category changed from ${lastLoadedCategory} to ${selectedCategory}, resetting state`);
        setLastLoadedCategory(selectedCategory);
        setCurrentQuestionIndex(0);
        setActiveRound(0);
        setShowResults(false);
        setReviewMode(false);
        setUserAnswers([]);
        
        const userId = session?.user?.id || walletAddress;
        if (userId) {
          console.log(`[QuizModal] Resetting quiz state for user ${userId}`);
          try {
            supabase.functions.invoke('reset-quiz-questions', {
              body: { 
                category: selectedCategory, 
                walletAddress: session?.user ? null : walletAddress
              }
            }).then(result => {
              if (result.error) {
                console.error("[QuizModal] Error resetting questions:", result.error);
              } else {
                console.log("[QuizModal] Successfully reset answered questions:", result.data);
              }
            });
          } catch (error) {
            console.error("[QuizModal] Error calling reset-quiz-questions function:", error);
          }
        }
      }
    }
  }, [selectedCategory, questions, isLoading, isError, showResults, refetch, session, walletAddress, lastLoadedCategory]);

  useEffect(() => {
    if (!showResults && !reviewMode) {
      setTimeLeft(20);
    }
  }, [currentQuestionIndex, activeRound, showResults, reviewMode]);

  useEffect(() => {
    let timerId: number | undefined;
    
    if (!showResults && !reviewMode && timeLeft > 0 && open) {
      timerId = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    if (timeLeft === 0 && !showResults && !reviewMode) {
      const globalIndex = activeRound * QUESTIONS_PER_ROUND + currentQuestionIndex;
      if (!userAnswers[globalIndex]) {
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else if (hasMoreRounds) {
            setActiveRound(activeRound + 1);
            setCurrentQuestionIndex(0);
          } else {
            setShowResults(true);
          }
        }, 500);
      }
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [timeLeft, showResults, reviewMode, open, currentQuestionIndex, questions.length, activeRound, hasMoreRounds, userAnswers]);

  useEffect(() => {
    if (open && selectedCategory) {
      if (!isAuthenticated) {
        console.log("[QuizModal] User not authenticated, showing signup dialog");
        setShowSignUpDialog(true);
        return;
      }
      
      if (selectedCategory !== lastLoadedCategory) {
        console.log(`[QuizModal] Category changed from ${lastLoadedCategory} to ${selectedCategory}, resetting state`);
        setLastLoadedCategory(selectedCategory);
        setCurrentQuestionIndex(0);
        setShowResults(false);
        setReviewMode(false);
        setUserAnswers([]);
        
        const userId = session?.user?.id || walletAddress;
        if (userId) {
          const resetAnsweredQuestions = async () => {
            try {
              console.log(`[QuizModal] Resetting answered questions tracking for new quiz session - ${selectedCategory}`);
              
              try {
                const resetResponse = await supabase.functions.invoke('reset-quiz-questions', {
                  body: { 
                    category: selectedCategory, 
                    walletAddress: session?.user ? null : walletAddress
                  }
                });
                
                if (resetResponse.error) {
                  console.error("[QuizModal] Error resetting questions:", resetResponse.error);
                } else {
                  console.log("[QuizModal] Successfully reset answered questions:", resetResponse.data);
                }
              } catch (error) {
                console.error("[QuizModal] Error calling reset-quiz-questions function:", error);
              }
              
              if (walletAddress) {
                const keysToReset = [
                  `answered_questions_${walletAddress}`,
                  `answered_questions_${selectedCategory}_${walletAddress}`,
                  `${selectedCategory}_answered_questions_${walletAddress}`
                ];
                
                for (const key of keysToReset) {
                  try {
                    localStorage.removeItem(key);
                    console.log(`[QuizModal] Removed localStorage key ${key}`);
                  } catch (e) {
                    console.error(`[QuizModal] Error accessing localStorage key ${key}:`, e);
                  }
                }
              }
            } catch (e) {
              console.error("[QuizModal] Error resetting answered questions:", e);
            }
          };
          
          resetAnsweredQuestions();
          
          const storedRoundKey = `quiz_last_round_${selectedCategory}_${userId}`;
          const storedRound = localStorage.getItem(storedRoundKey);
          if (storedRound) {
            const parsedRound = parseInt(storedRound, 10);
            if (!isNaN(parsedRound) && parsedRound >= 0) {
              console.log(`[QuizModal] Resuming from stored round: ${parsedRound}`);
              setActiveRound(parsedRound);
            } else {
              console.log("[QuizModal] Invalid stored round, resetting to 0");
              setActiveRound(0);
            }
          } else {
            console.log("[QuizModal] No stored round found, starting from round 0");
            setActiveRound(0);
          }
        }
        
        refetch();
      }
    }
  }, [open, selectedCategory, session, walletAddress, lastLoadedCategory, isAuthenticated, refetch]);

  useEffect(() => {
    if (selectedCategory) {
      const userId = session?.user?.id || walletAddress;
      if (userId) {
        const roundKey = `quiz_last_round_${selectedCategory}_${userId}`;
        localStorage.setItem(roundKey, activeRound.toString());
        console.log(`[QuizModal] Saved current round (${activeRound}) to localStorage for ${selectedCategory}`);
      }
    }
  }, [activeRound, selectedCategory, session, walletAddress]);

  useEffect(() => {
    if (!open) {
      setCurrentQuestionIndex(0);
      setShowResults(false);
      setReviewMode(false);
    }
  }, [open]);

  const handleWalletConnect = (connected: boolean, address: string | null) => {
    console.log("[QuizModal] Wallet connected:", connected, "Address:", address);
    if (connected && address) {
      setWalletAddress(address);
      toast({
        title: "Wallet Connected",
        description: "You can now play the quiz and track your progress."
      });
      
      refetch();
    }
  };

  const updateUserPoints = async (earnedPoints: number) => {
    try {
      if (session?.user) {
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', session.user.id)
          .single();

        if (fetchError) {
          console.error("[QuizModal] Error fetching profile:", fetchError);
          throw fetchError;
        }

        const currentPoints = profile?.points || 0;
        const newPoints = currentPoints + earnedPoints;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', session.user.id);

        if (updateError) {
          console.error("[QuizModal] Error updating profile points:", updateError);
          throw updateError;
        }
        
        console.log(`[QuizModal] Points updated in database: ${currentPoints} → ${newPoints}`);
      } 
      else if (walletAddress) {
        console.log(`[QuizModal] Updating points for wallet: ${walletAddress}, adding ${earnedPoints} points`);
        
        try {
          const { data: walletProfile, error: fetchError } = await supabase
            .from('wallet_profiles')
            .select('points, username')
            .eq('wallet_address', walletAddress)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("[QuizModal] Error fetching wallet profile:", fetchError);
          }

          const currentPoints = walletProfile?.points || 0;
          const newPoints = currentPoints + earnedPoints;
          const username = walletProfile?.username || `Wallet_${walletAddress.substring(0, 6)}`;
          
          console.log(`[QuizModal] Current points: ${currentPoints}, New points: ${newPoints}`);
          
          const { data: updatedProfile, error: upsertError } = await supabase
            .from('wallet_profiles')
            .upsert({ 
              wallet_address: walletAddress,
              username: username,
              points: newPoints,
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'wallet_address' 
            })
            .select();
            
          if (upsertError) {
            console.error("[QuizModal] Error updating wallet points:", upsertError);
            throw upsertError;
          }
          
          console.log(`[QuizModal] Wallet profile updated:`, updatedProfile);
        } catch (walletDbError) {
          console.error("[QuizModal] Error updating wallet points in database:", walletDbError);
        }
        
        try {
          const walletProfileKey = `wallet_profile_${walletAddress}`;
          let storedProfile: Record<string, any> = {};
          
          const profileString = localStorage.getItem(walletProfileKey);
          if (profileString) {
            storedProfile = JSON.parse(profileString);
          }
          
          const currentPoints = typeof storedProfile.points === 'number' ? storedProfile.points : 0;
          const newPoints = currentPoints + earnedPoints;
          
          const updatedProfile = {
            ...storedProfile,
            id: storedProfile.id || crypto.randomUUID(),
            username: storedProfile.username || `Wallet_${walletAddress.substring(0, 6)}`,
            wallet_address: walletAddress,
            points: newPoints,
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem(walletProfileKey, JSON.stringify(updatedProfile));
          console.log(`[QuizModal] Points updated in localStorage: ${currentPoints} → ${newPoints}`);
        } catch (localStorageError) {
          console.error('[QuizModal] Error updating wallet points in localStorage:', localStorageError);
        }
      }

      toast({
        title: "Points Earned!",
        description: `You earned ${earnedPoints} points!`,
        duration: 3000
      });
    } catch (error: any) {
      console.error('[QuizModal] Error updating points:', error);
      toast({
        title: "Error",
        description: "Failed to update points, but we'll try again later."
      });
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    const globalIndex = activeRound * QUESTIONS_PER_ROUND + currentQuestionIndex;
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!userAnswers[globalIndex]) {
      try {
        console.log(`[QuizModal] Marking question ${currentQuestion.id} as answered to prevent repeats`);
        const marked = await markQuestionAsAnswered(currentQuestion.id);
        if (!marked) {
          console.warn("[QuizModal] Failed to mark question as answered, may see repeats");
        } else {
          console.log(`[QuizModal] Successfully marked question ${currentQuestion.id} as answered`);
        }
        
        if (answer === currentQuestion.correct_answer) {
          await updateUserPoints(POINTS_PER_CORRECT_ANSWER);
        }
      } catch (error) {
        console.error("[QuizModal] Error marking question as answered:", error);
      }
    }
    
    const newAnswers = [...userAnswers];
    newAnswers[globalIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (hasMoreRounds) {
      setActiveRound(activeRound + 1);
      setCurrentQuestionIndex(0);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (activeRound > 0) {
      setActiveRound(activeRound - 1);
      setCurrentQuestionIndex(QUESTIONS_PER_ROUND - 1);
    }
  };

  const handleReviewAnswers = () => {
    setShowResults(false);
    setReviewMode(true);
    setCurrentQuestionIndex(0);
  };

  const handleStartNextRound = () => {
    if (hasMoreRounds) {
      setActiveRound(activeRound + 1);
      setCurrentQuestionIndex(0);
      setShowResults(false);
      setReviewMode(false);
    }
  };

  const handleFinishQuiz = async () => {
    const results = calculateResults();
    if (results.correctCount === results.totalAnswered && results.totalAnswered > 0) {
      await updateUserPoints(PERFECT_SCORE_BONUS);
      toast({
        title: "Perfect Score!",
        description: `Bonus ${PERFECT_SCORE_BONUS} points awarded!`,
      });
    }
    
    toast({
      title: "Quiz Completed",
      description: "Thanks for playing!",
    });
    
    handleResetQuiz();
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setReviewMode(false);
    
    if (selectedCategory) {
      const userId = session?.user?.id || walletAddress;
      if (userId) {
        localStorage.removeItem(`quiz_last_round_${selectedCategory}_${userId}`);
        console.log("[QuizModal] Reset saved round in localStorage");
        
        try {
          supabase.functions.invoke('reset-quiz-questions', {
            body: { 
              category: selectedCategory, 
              walletAddress: session?.user ? null : walletAddress
            }
          }).then(result => {
            if (result.error) {
              console.error("[QuizModal] Error resetting questions:", result.error);
            } else {
              console.log("[QuizModal] Successfully reset answered questions:", result.data);
            }
          });
        } catch (error) {
          console.error("[QuizModal] Error calling reset-quiz-questions function:", error);
        }
      }
    }
    
    setActiveRound(0);
    setLastLoadedCategory(null);
    onOpenChange(false);
  };

  const handleNewQuiz = () => {
    setShowResults(false);
    setActiveRound(0);
    setUserAnswers([]);
    setLastLoadedCategory(null);
    onOpenChange(false);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openQuizCategorySelector'));
    }, 100);
  };

  const handleClose = () => {
    setCurrentQuestionIndex(0);
    setActiveRound(0);
    setUserAnswers([]);
    setShowResults(false);
    setReviewMode(false);
    setLastLoadedCategory(null);
    onOpenChange(false);
  };

  const calculateResults = () => {
    const roundQuestions = allQuestions.slice(0, (activeRound + 1) * QUESTIONS_PER_ROUND);
    let correctAnswersCount = 0;
    
    roundQuestions.forEach((question, index) => {
      if (question.correct_answer === userAnswers[index]) {
        correctAnswersCount++;
      }
    });

    const score = (correctAnswersCount / roundQuestions.length) * 100;
    return {
      score,
      correctCount: correctAnswersCount,
      totalAnswered: roundQuestions.length,
      questions: roundQuestions,
      userAnswers: userAnswers.slice(0, roundQuestions.length)
    };
  };

  const recordQuizAttempt = async () => {
    const results = calculateResults();
    const isPerfectRound = results.correctCount === results.totalAnswered && results.totalAnswered > 0;
    
    try {
      if (session?.user) {
        await supabase.from('quiz_attempts').insert({
          user_id: session.user.id,
          score: Math.round(results.score),
          questions_answered: results.totalAnswered,
          correct_answers: results.correctCount,
          perfect_rounds: isPerfectRound ? 1 : 0
        });
      } else if (walletAddress) {
        await supabase.from('wallet_quiz_attempts').insert({
          wallet_address: walletAddress,
          score: Math.round(results.score),
          questions_answered: results.totalAnswered,
          correct_answers: results.correctCount,
          perfect_rounds: isPerfectRound ? 1 : 0
        });
      }
    } catch (error) {
      console.error('[QuizModal] Error recording quiz attempt:', error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <QuizLoading />;
    }

    if (isError) {
      return <QuizError onRetry={() => refetch()} />;
    }

    if (!allQuestions || allQuestions.length === 0) {
      return isPremium ? (
        <div className="text-center">
          <p className="mb-4">There are currently no questions available for this category.</p>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      ) : (
        <>
          <p className="mb-4">
            Upgrade to premium to get access to exclusive content and remove ads.
          </p>
          <Button onClick={() => setShowPremiumDialog(true)}>
            Upgrade to Premium
          </Button>
        </>
      );
    }

    if (showResults) {
      const results = calculateResults();
      recordQuizAttempt();
      
      return (
        <QuizResults 
          results={results}
          onReview={handleReviewAnswers}
          onNextRound={hasMoreRounds ? handleStartNextRound : undefined}
          onFinish={handleFinishQuiz}
          onNewQuiz={handleNewQuiz}
        />
      );
    }

    if (questions.length === 0) {
      return (
        <div className="text-center">
          <p className="mb-4">No more questions available in this round.</p>
          <Button onClick={handleResetQuiz}>Finish Quiz</Button>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const globalQuestionIndex = activeRound * QUESTIONS_PER_ROUND + currentQuestionIndex;
    
    if (!isPremium && currentQuestion.premium) {
      return (
        <>
          <p className="mb-4">This is a premium question. Upgrade to access it.</p>
          <Button onClick={() => setShowPremiumDialog(true)}>
            Upgrade to Premium
          </Button>
        </>
      );
    }

    if (reviewMode) {
      const currentRoundQuestions = allQuestions.slice(
        activeRound * QUESTIONS_PER_ROUND,
        (activeRound + 1) * QUESTIONS_PER_ROUND
      );
      
      const roundStartIndex = activeRound * QUESTIONS_PER_ROUND;
      
      return (
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md mb-4">
            <h3 className="font-semibold">Review Mode</h3>
            <p className="text-sm text-muted-foreground">
              Reviewing your answers for Round {activeRound + 1}. Green indicates correct answers, red indicates incorrect choices.
              <span className="block mt-2 italic">
                Think we got an answer wrong? DM a screenshot to our Instagram account and earn a 10,000 Quiz point bounty for spotting wrong answers!
              </span>
            </p>
          </div>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-8">
              {currentRoundQuestions.map((question, idx) => {
                const globalIdx = roundStartIndex + idx;
                return (
                  <div key={idx} className="pb-6 border-b last:border-b-0">
                    <div className="mb-2 text-sm text-muted-foreground">
                      Question {idx + 1} of {currentRoundQuestions.length}
                    </div>
                    <Question
                      question={question}
                      selectedAnswer={userAnswers[globalIdx]}
                      onSelect={() => {}} // No-op in review mode
                      reviewMode={true}
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setShowResults(true)}
              variant="default"
            >
              Back to Results
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <QuizContent
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          selectedAnswer={userAnswers[globalQuestionIndex]}
          onSelect={handleAnswerSelect}
          onPrevious={handlePreviousQuestion}
          onNext={handleNextQuestion}
          onSubmit={() => setShowResults(true)}
          roundInfo={{
            current: activeRound + 1,
            total: Math.ceil(allQuestions.length / QUESTIONS_PER_ROUND)
          }}
          reviewMode={reviewMode}
        />
      </div>
    );
  };

  const showTimer = !showResults && !reviewMode && questions.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[600px] max-h-[90vh] overflow-y-auto bg-background p-4" showCloseButton={false}>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl font-bold text-center">
              {selectedCategory ? `${selectedCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Quiz` : 'Quiz'}
            </DialogTitle>
            
            {showTimer && (
              <div className="flex justify-center mt-2">
                <div className="flex items-center gap-2 bg-primary/20 px-6 py-3 rounded-full">
                  <Timer className="h-7 w-7 text-primary" />
                  <span className={`font-mono text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-primary'}`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>
          
          <div className="absolute right-4 top-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <div className="p-0">
            {showPremiumDialog && (
              <PremiumAccessDialog 
                open={showPremiumDialog} 
                onOpenChange={setShowPremiumDialog}
                onUpgradeComplete={() => {
                  setShowPremiumDialog(false);
                  refetch();
                }}
              />
            )}
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>

      <WalletModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onConnect={handleWalletConnect}
        network="testnet"
        forcePrompt={true}
      />

      <WalletModal
        open={showSignUpDialog}
        onOpenChange={setShowSignUpDialog}
        onConnect={(connected, address) => {
          handleWalletConnect(connected, address);
          if (connected) {
            setShowSignUpDialog(false);
          }
        }}
        network="testnet"
        forcePrompt={true}
      />
    </>
  );
};
