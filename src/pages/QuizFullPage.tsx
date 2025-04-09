
import { useEffect } from "react";
import { Quiz } from "@/components/quiz/Quiz";
import { Helmet } from "react-helmet";
import { Navbar } from "@/components/Navbar";

const QuizFullPage = () => {
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
        <meta name="twitter:description" content="Test your crypto knowledge and earn rewards through our interactive crypto quiz platform." />
      </Helmet>
      <Navbar />
      <div className="pt-navbar">
        <Quiz />
      </div>
    </>
  );
};

export default QuizFullPage;
