
import { Button } from "@/components/ui/button";
import { Question } from "./Question";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { markQuestionAsAnswered } from "./hooks/useQuizQuestions";

interface QuizContentProps {
  currentQuestion: any;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  roundInfo?: {
    current: number;
    total: number;
  };
  reviewMode?: boolean;
}

export const QuizContent = ({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  selectedAnswer,
  onSelect,
  onPrevious,
  onNext,
  onSubmit,
  roundInfo,
  reviewMode = false,
}: QuizContentProps) => {
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log("Processing next question, marking as answered:", currentQuestion?.id);
    
    try {
      if (selectedAnswer && currentQuestion?.id) {
        // Add category for better tracking
        const success = await markQuestionAsAnswered(
          currentQuestion.id, 
          currentQuestion.category
        );
        
        if (success) {
          console.log(`Successfully marked question ${currentQuestion.id} as answered`);
          
          // Force profile update with explicit event
          window.dispatchEvent(new CustomEvent('forceProfileUpdate', {
            detail: { timestamp: new Date().toISOString() }
          }));
        } else {
          console.error(`Failed to mark question ${currentQuestion.id} as answered`);
          toast({
            title: "Warning",
            description: "Your progress was saved but there was an issue updating your profile stats.",
            variant: "destructive"
          });
        }
      } else {
        console.warn("Missing question ID or answer selection:", {
          questionId: currentQuestion?.id,
          hasAnswer: !!selectedAnswer
        });
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
    } finally {
      setIsProcessing(false);
      onNext();
    }
  };

  return (
    <div className="space-y-4">
      {roundInfo && (
        <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
          <span>Round {roundInfo.current} of {roundInfo.total}</span>
          <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"></span>
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
        </p>
      )}

      <Question
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        onSelect={onSelect}
        reviewMode={reviewMode}
      />

      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0 && roundInfo?.current === 1}
        >
          Previous
        </Button>
        
        {reviewMode ? (
          <Button 
            onClick={isLastQuestion ? onSubmit : onNext}
            variant={isLastQuestion ? "success" : "default"}
          >
            {isLastQuestion ? "Back to Results" : "Next Question"}
          </Button>
        ) : (
          selectedAnswer ? (
            isLastQuestion ? (
              <Button 
                onClick={onSubmit} 
                disabled={isProcessing}
                variant="success"
              >
                Finish Round
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                disabled={isProcessing}
                variant="default"
              >
                Next Question
              </Button>
            )
          ) : (
            <Button 
              disabled={true}
              variant="outline"
            >
              Select an Answer
            </Button>
          )
        )}
      </div>
    </div>
  );
};
