
import { Link, useNavigate } from "react-router-dom";
import { Diamond, Newspaper, Trophy, BarChart, Info, User, Coins } from "lucide-react";

interface NavLinksProps {
  onItemClick?: () => void;
  handlePresaleClick: (e: React.MouseEvent) => void;
  mobile?: boolean;
  walletConnected?: boolean;
}

export const NavLinks = ({ 
  onItemClick, 
  handlePresaleClick, 
  mobile = false,
  walletConnected = false
}: NavLinksProps) => {
  const baseClasses = mobile 
    ? "block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded flex items-center gap-2" 
    : "nav-link text-gray-300 hover:text-white flex items-center gap-2";

  return (
    <div className={mobile ? "flex flex-col" : "flex items-center justify-start gap-6"}>
      <a 
        href="#presale" 
        className={`${baseClasses} text-fuchsia-400 hover:text-fuchsia-300`}
        onClick={handlePresaleClick}
      >
        <Diamond className="h-4 w-4 text-fuchsia-400" />
        <span className="text-fuchsia-400">PRESALE</span>
      </a>
      <Link
        to="/about"
        className={baseClasses}
        onClick={onItemClick}
      >
        <Info className="h-4 w-4" />
        ABOUT CLAB
      </Link>
      <Link
        to="/blog"
        className={baseClasses}
        onClick={onItemClick}
      >
        <Newspaper className="h-4 w-4" />
        CRYPTO NEWS
      </Link>
      <Link
        to="/tokenomics"
        className={baseClasses}
        onClick={onItemClick}
      >
        <Coins className="h-4 w-4" />
        TOKENOMICS
      </Link>
      <Link
        to="/quiz"
        className={baseClasses}
        onClick={onItemClick}
      >
        <Trophy className="h-4 w-4" />
        QUIZ
      </Link>
      <Link
        to="/leaderboard"
        className={baseClasses}
        onClick={onItemClick}
      >
        <BarChart className="h-4 w-4" />
        LEADERBOARD
      </Link>
      
      {/* Only show Dashboard link when wallet is connected */}
      {walletConnected && (
        <Link
          to="/profile"
          className={baseClasses}
          onClick={onItemClick}
        >
          <User className="h-4 w-4" />
          DASHBOARD
        </Link>
      )}
    </div>
  );
};
