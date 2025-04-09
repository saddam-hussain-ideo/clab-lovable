import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, Loader2, X, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";
import { getCombinedLeaderboard } from "@/lib/services/walletProfileService";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { QuizPresaleBanner } from "@/components/quiz/QuizPresaleBanner";

const DEFAULT_AVATAR = "/lovable-uploads/988144ca-38fb-4273-a0cf-e82e64218efc.png";

interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  avatar_url: string | null;
  is_wallet: boolean;
  social_links?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

const getLevelInfo = (points: number): {
  title: string;
  color: string;
} => {
  if (points >= 1000000) return {
    title: "Crypto Whale",
    color: "text-blue-400"
  };
  if (points >= 500000) return {
    title: "DeFi Master",
    color: "text-purple-400"
  };
  if (points >= 250000) return {
    title: "Chain Validator",
    color: "text-green-400"
  };
  if (points >= 100000) return {
    title: "NFT Collector",
    color: "text-pink-400"
  };
  if (points >= 50000) return {
    title: "Smart Trader",
    color: "text-orange-400"
  };
  if (points >= 25000) return {
    title: "HODLer",
    color: "text-yellow-400"
  };
  if (points >= 10000) return {
    title: "Block Explorer",
    color: "text-cyan-400"
  };
  return {
    title: "Crypto Novice",
    color: "text-gray-400"
  };
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-700" />;
    default:
      return <Award className="h-6 w-6 text-emerald-500" />;
  }
};

const LeaderboardPagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="text-white/60 hover:text-white hover:bg-emerald-500/10"
      >
        Previous
      </Button>
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            "px-3 py-1 rounded-md text-sm font-medium transition-colors",
            currentPage === page
              ? "bg-emerald-500 text-white"
              : "text-white/60 hover:text-white hover:bg-emerald-500/10"
          )}
        >
          {page}
        </button>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="text-white/60 hover:text-white hover:bg-emerald-500/10"
      >
        Next
      </Button>
    </div>
  );
};

const Leaderboard = () => {
  const hasSyncedRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    data: leaderboard,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      console.log("Fetching leaderboard data...");
      const data = await getCombinedLeaderboard(100);
      console.log(`Fetched ${data?.length || 0} leaderboard entries:`, data);
      return data || [] as LeaderboardEntry[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (!hasSyncedRef.current) {
      refetch();
      hasSyncedRef.current = true;
    }
  }, [refetch]);

  const totalPages = leaderboard ? Math.ceil(leaderboard.length / usersPerPage) : 1;

  const getCurrentPageEntries = () => {
    if (!leaderboard) return [];
    const startIndex = (currentPage - 1) * usersPerPage;
    return leaderboard.slice(startIndex, startIndex + usersPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <Layout>
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 pt-8 md:pt-12 pb-12">
          <QuizPresaleBanner />
          
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 mt-12 text-white">
            Crypto Masters Leaderboard
          </h1>

          <div className="max-w-2xl mx-auto mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{
            points: 1000000,
            title: "Crypto Whale"
          }, {
            points: 500000,
            title: "DeFi Master"
          }, {
            points: 250000,
            title: "Chain Validator"
          }, {
            points: 100000,
            title: "NFT Collector"
          }, {
            points: 50000,
            title: "Smart Trader"
          }, {
            points: 25000,
            title: "HODLer"
          }, {
            points: 10000,
            title: "Block Explorer"
          }, {
            points: 0,
            title: "Crypto Novice"
          }].map(level => <Card key={level.title} className="p-3 bg-white/5 backdrop-blur-lg border border-white/10">
                <p className="text-xs text-gray-400 mb-1">{level.points.toLocaleString()}+ pts</p>
                <p className={cn("text-sm font-medium", getLevelInfo(level.points).color)}>
                  {level.title}
                </p>
              </Card>)}
          </div>
          
          {isLoading ? <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div> : leaderboard && leaderboard.length > 0 ? <div className="grid gap-4 max-w-2xl mx-auto">
              {getCurrentPageEntries().map((entry, index) => {
            const actualRank = (currentPage - 1) * usersPerPage + index + 1;
            return <Card key={entry.id} className={cn("p-4", actualRank <= 3 ? "bg-emerald-50/5" : "bg-white/5", "backdrop-blur-lg border border-white/10")}>
                    <div className="grid grid-cols-12 items-center">
                      <div className="col-span-5 flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 text-center font-bold text-white">
                          {actualRank}
                        </div>
                        <div className="flex-shrink-0">
                          {getRankIcon(actualRank)}
                        </div>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={entry.avatar_url || DEFAULT_AVATAR} alt={entry.username || 'User'} />
                          <AvatarFallback>
                            <img src={DEFAULT_AVATAR} alt="CLAB" className="h-full w-full object-cover" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 hidden md:block">
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-white truncate">
                              {entry.username || "AnonBoss"}
                            </p>
                            <p className={cn("text-xs", getLevelInfo(entry.points).color)}>
                              {getLevelInfo(entry.points).title}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:hidden col-span-3">
                        <p className="text-sm font-medium text-white truncate">
                          {entry.username || "AnonBoss"}
                        </p>
                      </div>
                      
                      <div className="col-span-4 flex justify-center">
                        {entry.social_links?.twitter && <Button variant="ghost" size="sm" className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10" onClick={() => window.open(`https://twitter.com/${entry.social_links?.twitter}`, '_blank')}>
                            <span className="flex items-center gap-1">
                              <X className="h-4 w-4" />
                              X
                            </span>
                          </Button>}
                      </div>
                      
                      <div className="col-span-3 flex justify-end">
                        <p className="text-md md:text-lg font-semibold text-emerald-400">
                          {entry.points.toLocaleString()} pts
                        </p>
                      </div>
                    </div>
                  </Card>;
          })}
              
              {totalPages > 1 && <div className="mt-6">
                  <LeaderboardPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>}
            </div> : <div className="text-center p-8">
              <Card className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 max-w-md mx-auto">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold text-white mb-2">No Users on Leaderboard Yet</h2>
                <p className="text-white/60">
                  Complete quizzes to earn points and be the first to appear on the leaderboard!
                </p>
              </Card>
            </div>}
          
          <div className="mt-16 text-center max-w-2xl mx-auto">
            
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Leaderboard;
