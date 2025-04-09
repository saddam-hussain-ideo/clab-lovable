
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { POINTS_PER_CORRECT_ANSWER, PERFECT_SCORE_BONUS } from "./constants";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface HowItWorksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pointsPerCorrectAnswer?: number;
  perfectScoreBonus?: number;
}

export const HowItWorksDialog = ({ 
  open, 
  onOpenChange,
  pointsPerCorrectAnswer = POINTS_PER_CORRECT_ANSWER, 
  perfectScoreBonus = PERFECT_SCORE_BONUS 
}: HowItWorksDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-black border-zinc-800" 
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">How the Quiz Works</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm space-y-2 text-gray-300">
            <p>Choose a category and answer crypto-related questions</p>
            <p>Earn {pointsPerCorrectAnswer} points for each correct answer</p>
            <p>Get a bonus {perfectScoreBonus} points for achieving a perfect score</p>
            <p>Accumulate Quiz points in your profile</p>
            <p>Exchange your Quiz points for CLAB tokens when our token launches</p>
          </div>
          <p className="text-xs text-gray-400">
            Quiz points will be exchangeable for CLAB tokens at launch.
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none h-4 w-4 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </DialogContent>
    </Dialog>
  );
};
