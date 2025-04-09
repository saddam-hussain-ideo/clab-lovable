
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface QuizErrorProps {
  onRetry: () => void;
}

export const QuizError = ({ onRetry }: QuizErrorProps) => {
  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Failed to Load Quiz</h2>
      <p className="text-muted-foreground mb-6">
        We couldn't load the quiz questions. Please try again.
      </p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
};
