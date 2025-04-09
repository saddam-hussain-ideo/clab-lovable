
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Star, ArrowUpCircle, Gem } from "lucide-react";
import { PremiumAccessDialog } from "./quiz/PremiumAccessDialog";
import { QuizModal } from "./quiz/QuizModal";
import { cn } from "@/lib/utils";
import { QuizCategory } from "@/lib/types/quiz";

export const QuizPromotionWidget = ({ className }: { className?: string }) => {
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);

  const handleStartQuiz = () => {
    // For promotion widget, we'll default to a specific category (bitcoin_history)
    setSelectedCategory('bitcoin_history');
    setShowQuizModal(true);
  };

  return (
    <div className={cn("bg-card rounded-lg border shadow-sm", className)}>
      <CardContent className="p-8 text-center relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent)] pointer-events-none" />
        
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="p-3 bg-emerald-500/20 rounded-full">
              <Trophy className="w-12 h-12 text-emerald-300" />
            </div>
            <Star className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            <Gem className="w-4 h-4 text-emerald-400 absolute -bottom-1 -right-2 animate-bounce" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-200 to-emerald-100 bg-clip-text text-transparent mb-3">
          Challenge Your Crypto Knowledge!
        </h3>
        
        <p className="text-gray-300 text-sm mb-6">
          Take our interactive crypto quiz, climb the leaderboard, and earn CLAB tokens.
          Upgrade to premium for unlimited access!
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={handleStartQuiz}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg transition-all duration-300"
            size="lg"
          >
            Start Quiz Now
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-500/20 group transition-all duration-300"
            onClick={() => setShowUpgradeDialog(true)}
          >
            <ArrowUpCircle className="mr-2 h-4 w-4 text-emerald-400 group-hover:text-emerald-300" />
            <span className="bg-gradient-to-r from-emerald-200 to-emerald-100 bg-clip-text text-transparent">
              Upgrade to Premium
            </span>
          </Button>
        </div>

        <PremiumAccessDialog 
          open={showUpgradeDialog} 
          onOpenChange={setShowUpgradeDialog}
          onUpgradeComplete={() => {
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
          }}
        />
        
        <QuizModal 
          open={showQuizModal}
          onOpenChange={setShowQuizModal}
          selectedCategory={selectedCategory}
        />
      </CardContent>
    </div>
  );
};
