
import { Play, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Profile } from "@/types/profile";
import { toast } from "@/hooks/use-toast";

interface QuizActionPanelProps {
  profile: Profile;
  totalQuestions: number;
  hasUnlimitedAccess?: boolean;
  attemptsRemaining?: number | null;
}

export const QuizActionPanel = ({
  profile,
  totalQuestions,
  hasUnlimitedAccess = false,
  attemptsRemaining = null,
}: QuizActionPanelProps) => {
  const navigate = useNavigate();
  
  const handleStartQuiz = () => {
    navigate("/quiz");
    toast({
      title: "Quiz loaded",
      description: "Pick a category to start your quiz!",
    });
  };
  
  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Crypto Quiz Challenge</h3>
              <p className="text-zinc-400 mb-4">
                Test your crypto knowledge, earn points, and climb the leaderboard!
              </p>
              
              {/* Show access status */}
              {hasUnlimitedAccess ? (
                <div className="inline-flex items-center px-3 py-1 mb-3 bg-emerald-900/30 text-emerald-400 text-sm rounded-full border border-emerald-800/50">
                  <Diamond className="h-3 w-3 mr-1" />
                  Unlimited Access
                </div>
              ) : attemptsRemaining !== null && attemptsRemaining > 0 ? (
                <div className="inline-flex items-center px-3 py-1 mb-3 bg-amber-900/30 text-amber-400 text-sm rounded-full border border-amber-800/50">
                  {attemptsRemaining} free {attemptsRemaining === 1 ? 'round' : 'rounds'} remaining
                </div>
              ) : (
                <div className="inline-flex items-center px-3 py-1 mb-3 bg-red-900/30 text-red-400 text-sm rounded-full border border-red-800/50">
                  Upgrade for unlimited access
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleStartQuiz}
              className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-none text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Quiz Now
            </Button>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-6 border-l border-zinc-800">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-400">Total Points</p>
                <p className="text-2xl font-bold text-purple-400">{profile.points.toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-zinc-400">Questions Answered</p>
                <p className="text-2xl font-bold text-blue-400">{totalQuestions.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
