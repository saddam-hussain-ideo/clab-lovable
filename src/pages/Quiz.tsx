
import { useState, useEffect } from "react";
import { Quiz } from "@/components/quiz/Quiz";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { HowItWorksDialog } from "@/components/quiz/HowItWorksDialog";
import { InfoIcon } from "lucide-react";
import { POINTS_PER_CORRECT_ANSWER, PERFECT_SCORE_BONUS } from "@/components/quiz/constants";
import { Layout } from "@/components/Layout";
import { QuizPresaleBanner } from "@/components/quiz/QuizPresaleBanner";

const QuizPage = () => {
  const [showHowItWorksDialog, setShowHowItWorksDialog] = useState(false);

  // Force scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <>
      <Helmet>
        <title>Crypto Quiz | Crypto Like a Boss - Crypto Academy</title>
        <meta name="description" content="Test your crypto knowledge, earn rewards, and learn about Web3, DeFi, and memecoins through our interactive quiz platform." />
        <meta name="keywords" content="crypto quiz, cryptocurrency test, web3 quiz, blockchain quiz, defi knowledge test, crypto rewards, crypto education" />
        <meta property="og:title" content="Crypto Quiz | Crypto Like a Boss" />
        <meta property="og:description" content="Test your crypto knowledge, earn rewards, and learn about Web3, DeFi, and memecoins through our interactive quiz platform." />
        <meta name="twitter:title" content="Crypto Quiz | Crypto Like a Boss" />
        <meta name="twitter:description" content="Test your crypto knowledge and earn rewards through our interactive quiz platform." />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-12 mt-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 text-zinc-50">Crypto Trivia Quiz</h1>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowHowItWorksDialog(true)} className="flex items-center gap-2">
                <InfoIcon className="h-4 w-4" />
                HOW IT WORKS
              </Button>
            </div>
          </div>
          <Quiz />
          <QuizPresaleBanner />
          <HowItWorksDialog open={showHowItWorksDialog} onOpenChange={setShowHowItWorksDialog} pointsPerCorrectAnswer={POINTS_PER_CORRECT_ANSWER} perfectScoreBonus={PERFECT_SCORE_BONUS} />
        </div>
      </Layout>
    </>
  );
};

export default QuizPage;
