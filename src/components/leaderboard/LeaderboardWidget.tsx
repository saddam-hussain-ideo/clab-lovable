
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { getCombinedLeaderboard } from "@/lib/services/walletProfileService";

// Default avatar image path
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

interface LeaderboardWidgetProps {
  className?: string;
}

export const LeaderboardWidget = ({ className }: LeaderboardWidgetProps) => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard-widget"],
    queryFn: async () => {
      console.log("Fetching leaderboard widget data...");
      
      // Fetch more entries than needed to ensure we have enough after filtering
      const data = await getCombinedLeaderboard(20);
      
      console.log(`Fetched ${data.length} leaderboard entries:`, data);
      
      if (data.length === 0) {
        console.log("No leaderboard entries found");
      }

      // Ensure any Wallet_ prefixes are replaced with AnonBoss
      return data.map(entry => ({
        ...entry,
        username: entry.username?.startsWith('Wallet_') ? 'AnonBoss' : (entry.username || "AnonBoss")
      })) as LeaderboardEntry[];
    },
    staleTime: 30000, // Refresh more frequently (30 seconds)
    refetchOnWindowFocus: true,
  });

  if (isLoading || !leaderboard) {
    return (
      <Card className={cn("p-4 bg-white/5 backdrop-blur-lg border border-white/10", className)}>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4 bg-white/5 backdrop-blur-lg border border-white/10", className)}>
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        Top Players
      </h3>
      <div className="space-y-3">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.slice(0, 10).map((entry, index) => (
            <Link
              key={entry.id}
              to="/leaderboard"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-6 font-medium text-sm text-gray-400">
                #{index + 1}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.avatar_url || DEFAULT_AVATAR} alt={entry.username || 'User'} />
                <AvatarFallback>
                  <img src={DEFAULT_AVATAR} alt="CLAB" className="h-full w-full object-cover" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {entry.username || "AnonBoss"}
                </p>
                <p className="text-sm text-emerald-400 font-medium">
                  {entry.points.toLocaleString()} pts
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-white/60">
            No players have earned points yet
          </div>
        )}
      </div>
      <Link
        to="/leaderboard"
        className={cn(
          "block text-center text-sm text-white/60 hover:text-white",
          "mt-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
        )}
      >
        View Full Leaderboard →
      </Link>
    </Card>
  );
};
