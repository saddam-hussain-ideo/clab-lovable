import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuizQuestion as QuizQuestionType } from "@/lib/types/quiz";
import { CheckCircle, XCircle, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
}

interface ShuffledOption {
  text: string;
  originalIndex: number;
}

export const QuizQuestion = ({
  question,
  onAnswer,
  onNext,
}: QuizQuestionProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  
  useEffect(() => {
    setSelectedOption(null);
    setHasAnswered(false);
    setTimeLeft(20);
    
    const optionsWithIndices: ShuffledOption[] = question.options.map((text, index) => ({
      text,
      originalIndex: index,
    }));

    const shuffled = [...optionsWithIndices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setShuffledOptions(shuffled);
  }, [question]);

  useEffect(() => {
    if (!hasAnswered && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !hasAnswered) {
      handleSubmit();
    }
  }, [timeLeft, hasAnswered]);

  const handleSubmit = () => {
    if (hasAnswered) return;
    
    const isCorrect = selectedOption !== null 
      ? shuffledOptions[selectedOption].originalIndex === question.correct_option
      : false;
    
    console.log({
      questionId: question.id,
      questionText: question.text,
      selectedOption: selectedOption !== null ? shuffledOptions[selectedOption].originalIndex : null,
      correctOption: question.correct_option,
      isCorrect,
      timeLeft
    });
    
    setHasAnswered(true);
    onAnswer(isCorrect);
  };

  const handleOptionChange = (value: string) => {
    if (!hasAnswered) {
      const optionIndex = parseInt(value, 10);
      setSelectedOption(optionIndex);
      console.log('Selected option:', {
        currentIndex: optionIndex,
        originalIndex: shuffledOptions[optionIndex].originalIndex,
        text: shuffledOptions[optionIndex].text
      });
    }
  };

  const handleOptionClick = (currentIndex: number) => {
    if (!hasAnswered) {
      setSelectedOption(currentIndex);
      console.log('Selected option (via box click):', {
        currentIndex,
        originalIndex: shuffledOptions[currentIndex].originalIndex,
        text: shuffledOptions[currentIndex].text
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto bg-zinc-800 border border-zinc-700 shadow-lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            {question.text}
          </h3>
          <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-md">
            <Timer className="h-5 w-5 text-gray-300" />
            <span className={`font-mono ${timeLeft <= 5 ? 'text-red-400' : 'text-gray-300'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        <Progress 
          value={(timeLeft / 20) * 100} 
          className="h-2"
          indicatorClassName="bg-primary"
        />
        
        <RadioGroup
          className="space-y-3"
          value={selectedOption?.toString()}
          onValueChange={handleOptionChange}
          disabled={hasAnswered}
        >
          {shuffledOptions.map((option, currentIndex) => {
            const isCorrect = option.originalIndex === question.correct_option;
            const isSelected = selectedOption === currentIndex;
            const showCorrectAnswer = hasAnswered && isCorrect;
            const showWrongAnswer = hasAnswered && isSelected && !isCorrect;

            return (
              <div
                key={currentIndex}
                className={`flex items-center space-x-2 p-4 rounded-lg border ${
                  showCorrectAnswer
                    ? "border-emerald-500 bg-emerald-900/40"
                    : showWrongAnswer
                    ? "border-red-500 bg-red-900/40"
                    : isSelected
                    ? "border-primary bg-primary/10"
                    : "border-zinc-600 hover:border-primary/70 bg-zinc-700/30"
                } ${!hasAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => !hasAnswered && handleOptionClick(currentIndex)}
              >
                <RadioGroupItem 
                  value={currentIndex.toString()} 
                  id={`option-${currentIndex}`}
                  className="text-primary border-zinc-500"
                />
                <Label 
                  htmlFor={`option-${currentIndex}`} 
                  className="flex-1 cursor-pointer text-white"
                >
                  {option.text}
                </Label>
                {showCorrectAnswer && (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                )}
                {showWrongAnswer && (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            );
          })}
        </RadioGroup>

        {!hasAnswered ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="w-full bg-primary hover:bg-primary/80 text-white"
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            onClick={onNext} 
            variant="secondary" 
            className="w-full text-white hover:bg-zinc-600 border-zinc-600"
          >
            Next Question
          </Button>
        )}
      </div>
    </Card>
  );
};
