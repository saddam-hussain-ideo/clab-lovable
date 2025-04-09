
import React from 'react';
import { Award, Coins, Play, ShoppingCart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface ProfilePointsDisplayProps {
  points: number;
}

export const ProfilePointsDisplay: React.FC<ProfilePointsDisplayProps> = ({ points }) => {
  const navigate = useNavigate();
  
  // Make sure points is a valid number
  const displayPoints = typeof points === 'number' && !isNaN(points) ? points : 0;
  
  // Add debug log to track when points are displayed
  console.log(`[ProfilePointsDisplay] Rendering with points: ${displayPoints}, type: ${typeof points}`);
  
  const handleStartQuiz = () => {
    navigate("/quiz");
    toast({
      title: "Quiz loaded",
      description: "Pick a category to start your quiz!",
    });
  };
  
  const handleBuyTokens = () => {
    navigate("/#presale");
    toast({
      title: "CLAB Presale",
      description: "Ready to purchase CLAB tokens!",
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex flex-col gap-3 p-4 bg-zinc-900 rounded-md border border-zinc-700">
        <div className="flex items-center gap-3">
          <Award className="h-10 w-10 text-yellow-500" />
          <div>
            <h3 className="text-lg font-medium text-white">Quiz Points</h3>
            <p className="text-2xl font-bold text-yellow-500">{displayPoints.toLocaleString()}</p>
          </div>
        </div>
        
        <Button 
          onClick={handleStartQuiz}
          className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-none text-white"
        >
          <Play className="h-4 w-4 mr-2" />
          Start Quiz Now
        </Button>
      </div>
      
      <div className="flex flex-col gap-3 p-4 bg-zinc-900 rounded-md border border-zinc-700">
        <div className="flex items-center gap-3">
          <Coins className="h-10 w-10 text-emerald-500" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Token Purchases</h3>
            <p className="text-sm text-zinc-400">Check your purchases in the "Purchases" tab</p>
          </div>
        </div>
        
        <Button
          onClick={handleBuyTokens}
          className="mt-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 border-none text-white"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Buy CLAB Tokens
        </Button>
      </div>
    </div>
  );
};
