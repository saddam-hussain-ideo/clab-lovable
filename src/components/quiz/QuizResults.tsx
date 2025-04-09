
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { Trophy, ExternalLink, Play, Coins, RotateCcw, CheckCircle, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { POINTS_PER_CORRECT_ANSWER, PERFECT_SCORE_BONUS } from "./constants";

interface QuizResultsProps {
  results: {
    score: number;
    correctCount: number;
    totalAnswered: number;
    questions: any[];
    userAnswers: string[];
  };
  onReview: () => void;
  onNextRound?: () => void;
  onFinish: () => void;
  onNewQuiz?: () => void;
}

export const QuizResults = ({ 
  results, 
  onReview, 
  onNextRound, 
  onFinish,
  onNewQuiz
}: QuizResultsProps) => {
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const hasDispatchedEvent = useRef(false);
  
  // Calculate points earned - using the same constants as in useQuizState
  // Note: This is only for display purposes and doesn't affect the database
  const basePoints = results.correctCount * POINTS_PER_CORRECT_ANSWER;
  const perfectBonus = results.correctCount === results.totalAnswered && results.totalAnswered > 0 
    ? PERFECT_SCORE_BONUS 
    : 0;
  const totalPointsEarned = basePoints + perfectBonus;
  
  // Trigger confetti only once when score is above threshold
  if (results.score >= 70 && !confettiTriggered) {
    setConfettiTriggered(true);
    
    // Launch confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Dispatch an event when the quiz results are shown - but only once
  useEffect(() => {
    if (!hasDispatchedEvent.current) {
      // Trigger a quiz completed event when results are shown
      console.log('QuizResults: Dispatching quizActivityUpdated event - ONLY ONCE');
      window.dispatchEvent(new CustomEvent('quizActivityUpdated'));
      hasDispatchedEvent.current = true;
    }
    
    // Cleanup - reset the flag when component unmounts to avoid event being skipped on remount
    return () => {
      // Do not reset the flag - we want it to stay true even if component remounts
      // This prevents multiple dispatches for the same quiz results
    };
  }, []);
  
  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent! You're a crypto expert!";
    if (score >= 70) return "Great job! You know your stuff!";
    if (score >= 50) return "Good effort! Keep learning!";
    return "Keep studying! You'll improve next time!";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-green-400";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex flex-col items-center space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Quiz Results</h2>
        <p>You've completed this round!</p>
      </div>
      
      <div className="w-full max-w-md bg-muted/50 rounded-lg p-6 space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="bg-primary/10 p-3 rounded-full">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">
            Your Score
          </h3>
          <div className={`text-3xl font-bold ${getScoreColor(results.score)}`}>
            {Math.round(results.score)}%
          </div>
          <p className="text-muted-foreground text-center">
            {getScoreMessage(results.score)}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{results.correctCount} of {results.totalAnswered} correct</span>
          </div>
          <Progress 
            value={results.score} 
            className={`h-2 ${getProgressColor(results.score)}`} 
          />
        </div>
        
        {/* Points earned display */}
        <div className="mt-4 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            <span className="font-medium">Points Earned:</span>
          </div>
          <div className="text-xl font-bold text-primary">
            {totalPointsEarned}
            {perfectBonus > 0 && (
              <span className="text-sm ml-2 bg-green-500 text-white px-2 py-0.5 rounded-full">
                +{perfectBonus} Perfect Bonus!
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Buttons formatted in a 2x2 grid */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          onClick={onReview}
          className="flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          <span>Review Results</span>
        </Button>
        
        <Link to="/profile?tab=quizzes" className="block">
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <span>See All Results</span>
            <ExternalLink size={16} />
          </Button>
        </Link>
        
        {onNextRound ? (
          <Button 
            className="flex items-center justify-center gap-2"
            onClick={onNextRound}
          >
            <Play size={16} />
            <span>Start Next Round</span>
          </Button>
        ) : (
          <Button 
            className="flex items-center justify-center gap-2"
            onClick={onFinish}
          >
            <CheckCircle size={16} />
            <span>Finish Quiz</span>
          </Button>
        )}
        
        {/* New Start Next Quiz button */}
        <Button 
          variant="outline"
          onClick={onNewQuiz}
          className="flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          <span>Start New Quiz</span>
        </Button>
      </div>
    </div>
  );
};
