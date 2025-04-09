
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { HowItWorksDialog } from "./HowItWorksDialog";
import { CategorySelector } from "./CategorySelector";
import { QuizCategory } from "@/lib/types/quiz";
import { toast } from "@/hooks/use-toast";
import { verifyWalletConnection } from "@/utils/wallet/index";
import { WalletModal } from "@/components/wallet/WalletModal";

interface QuizIntroProps {
  onStart?: (category: QuizCategory) => void;
}

export const QuizIntro = ({ onStart }: QuizIntroProps) => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [showHowItWorksDialog, setShowHowItWorksDialog] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [step, setStep] = useState<'intro' | 'categories' | 'ready'>('categories');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const storedWalletAddress = localStorage.getItem('walletAddress');
        if (storedWalletAddress) {
          console.log("Found stored wallet address:", storedWalletAddress);
          const isConnected = await verifyWalletConnection();
          console.log("Wallet verification result:", isConnected);
          setIsWalletConnected(isConnected);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };
    
    checkWalletConnection();
    
    const handleWalletChanged = async () => {
      console.log("Wallet changed event detected");
      await checkWalletConnection();
    };

    window.addEventListener('walletChanged', handleWalletChanged);
    
    return () => {
      window.removeEventListener('walletChanged', handleWalletChanged);
    };
  }, []);

  const handleStartQuiz = async () => {
    if (!selectedCategory) {
      console.error("Cannot start quiz: no category selected");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a category first",
      });
      return;
    }
    
    if (!onStart) {
      console.error("Cannot start quiz: missing onStart function");
      return;
    }

    if (!isWalletConnected) {
      console.error("Cannot start quiz: wallet not connected");
      setShowWalletModal(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Executing quiz start with category:", selectedCategory);
      onStart(selectedCategory);
      toast({
        title: "Quiz started!",
        description: `Starting ${selectedCategory.replace('_', ' ')} quiz...`,
      });
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        variant: "destructive",
        title: "Failed to start quiz",
        description: "Please try again or select a different category.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (category: QuizCategory) => {
    console.log("Category selected:", category);
    setSelectedCategory(category);
    setStep('ready');
    
    // If wallet not connected, show wallet modal
    if (!isWalletConnected) {
      console.log("Wallet not connected, showing wallet modal");
      setShowWalletModal(true);
    }
  };

  const handleWalletConnected = (connected: boolean, address?: string | null) => {
    console.log("Wallet connected status:", connected, "address:", address);
    setIsWalletConnected(connected);
  };

  return (
    <div className="max-w-5xl mx-auto text-center py-8">
      {step === 'intro' ? (
        <>
          <h1 className="text-3xl font-bold mb-4">Crypto Knowledge Quiz</h1>
          <p className="text-lg mb-6">
            Test your crypto knowledge and earn rewards by completing our quiz. Sign in to start!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setStep('categories')}
              className="bg-primary hover:bg-primary/90"
            >
              Start Quiz
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setShowHowItWorksDialog(true)}
            >
              How It Works
            </Button>
          </div>
        </>
      ) : step === 'categories' ? (
        <>
          <h1 className="text-3xl font-bold mb-6">Crypto Knowledge Quiz</h1>
          <CategorySelector onSelectCategory={handleSelectCategory} />
          <div className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowHowItWorksDialog(true)}
              className="mx-auto"
            >
              How It Works
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">Crypto Knowledge Quiz</h1>
          <div className="max-w-md mx-auto mb-8 p-6 bg-card rounded-lg border border-border shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Selected Category: {selectedCategory?.replace('_', ' ')}
            </h2>
            
            {isWalletConnected ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Your wallet is connected. You're ready to start the quiz!
                </p>
                <Button 
                  onClick={handleStartQuiz}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></span>
                      Starting Quiz...
                    </>
                  ) : (
                    "Start Quiz"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-yellow-500 mb-2">
                  Connect your wallet to start the quiz
                </p>
                <Button
                  onClick={() => setShowWalletModal(true)}
                  variant="outline"
                  className="w-full"
                >
                  Connect Wallet
                </Button>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              onClick={() => setStep('categories')}
              className="mt-3 w-full"
            >
              Choose Different Category
            </Button>
          </div>
        </>
      )}

      <WalletModal 
        open={showWalletModal} 
        onOpenChange={setShowWalletModal}
        onConnect={handleWalletConnected}
        network="testnet"
        forcePrompt={true}
      />
      
      {showHowItWorksDialog && (
        <HowItWorksDialog
          open={showHowItWorksDialog}
          onOpenChange={setShowHowItWorksDialog}
          pointsPerCorrectAnswer={10}
          perfectScoreBonus={50}
        />
      )}
    </div>
  );
};
