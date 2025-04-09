
import React, { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";

interface QuestionProps {
  question: {
    id: number;
    question: string;
    options: string[];
    correct_answer: string;
  };
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  autoAdvance?: boolean;
  reviewMode?: boolean;
}

interface ShuffledOption {
  value: string;
  isCorrect: boolean;
}

export const Question = ({ 
  question, 
  selectedAnswer, 
  onSelect,
  autoAdvance = true,
  reviewMode = false
}: QuestionProps) => {
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  
  // Shuffle options when question changes (but only if not in review mode)
  useEffect(() => {
    const options = question.options.map(option => ({
      value: option,
      isCorrect: option === question.correct_answer
    }));
    
    if (!reviewMode) {
      // Fisher-Yates shuffle algorithm
      const shuffled = [...options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledOptions(shuffled);
    } else {
      // In review mode, don't shuffle to maintain consistency
      setShuffledOptions(options);
    }
    
    // Reset hasAnswered state when question changes
    setHasAnswered(false);
  }, [question, reviewMode]);

  // Set hasAnswered to true when selectedAnswer changes from undefined to a value
  useEffect(() => {
    if (selectedAnswer && !hasAnswered) {
      setHasAnswered(true);
    }
  }, [selectedAnswer]);

  const handleSelectAnswer = (value: string) => {
    if (!reviewMode && !hasAnswered) {
      onSelect(value);
      setHasAnswered(true);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium">{question.question}</h2>
      <RadioGroup 
        value={selectedAnswer} 
        onValueChange={handleSelectAnswer}
        className="space-y-2"
        disabled={hasAnswered || reviewMode}
      >
        {shuffledOptions.map((option, index) => {
          const isSelected = option.value === selectedAnswer;
          const isCorrect = option.value === question.correct_answer;
          
          // Determine styling based on review mode and correctness
          let optionClassName = "flex items-center space-x-2 rounded-md border p-3 transition-all ";
          
          if (reviewMode) {
            // In review mode, style differs based on whether the option is correct or selected incorrectly
            if (isCorrect) {
              optionClassName += "border-green-500 bg-green-100 dark:bg-green-900/30";
            } else if (isSelected) {
              optionClassName += "border-red-500 bg-red-100 dark:bg-red-900/30";
            } else {
              optionClassName += "opacity-60";
            }
          } else if (hasAnswered) {
            // When answered but not in review mode
            if (isSelected) {
              optionClassName += "border-primary bg-primary/20";
            } else {
              optionClassName += "opacity-60";
            }
          } else {
            // Normal mode - just highlight selection
            if (isSelected) {
              optionClassName += "border-primary bg-primary/20 ring-2 ring-primary/30";
            } else {
              optionClassName += "hover:bg-accent";
            }
          }
          
          // Text color for better readability in review mode
          let textClassName = "flex-grow cursor-pointer";
          if (reviewMode) {
            if (isCorrect) {
              textClassName += " text-green-800 dark:text-green-200 font-medium";
            } else if (isSelected) {
              textClassName += " text-red-800 dark:text-red-200 font-medium";
            }
          }
          
          // If answered but not in review mode, change cursor to indicate disabled
          if (hasAnswered && !reviewMode) {
            textClassName = textClassName.replace("cursor-pointer", "cursor-default");
          }
          
          return (
            <div 
              key={index} 
              className={optionClassName}
            >
              <RadioGroupItem 
                value={option.value} 
                id={`option-${index}`} 
                disabled={hasAnswered || reviewMode}
              />
              <Label 
                htmlFor={`option-${index}`} 
                className={textClassName}
              >
                {option.value}
              </Label>
              
              {/* Show correct/incorrect icons in review mode */}
              {reviewMode && (
                <div className="ml-2">
                  {isCorrect ? (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : isSelected ? (
                    <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};
