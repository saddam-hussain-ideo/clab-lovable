
import { useClipboard } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CopyIcon, Users, RefreshCcw, Loader2 } from "lucide-react";
import { useState } from "react";

interface ReferralSectionProps {
  referralCode: string;
  referrals: any[];
  points?: number;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const ReferralSection = ({ 
  referralCode, 
  referrals, 
  points, 
  onRefresh,
  isLoading = false
}: ReferralSectionProps) => {
  const { copied, copyToClipboard } = useClipboard(3000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleCopy = () => {
    const referralLink = `${window.location.origin}/?ref=${referralCode}`;
    copyToClipboard(referralLink);
    console.log("Copied referral link:", referralLink);
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      console.log("Refreshing referrals data...");
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 700);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>Invite friends and earn rewards</CardDescription>
        </div>

        {onRefresh && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            title="Refresh referrals"
          >
            {(isRefreshing || isLoading) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {points !== undefined && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-md border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                Quiz Points: {points.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="referral-link" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Your Referral Link
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-grow">
              <input
                id="referral-link"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={referralCode ? `${window.location.origin}/?ref=${referralCode}` : 'Loading your referral code...'}
                readOnly
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="h-10 w-10"
              disabled={!referralCode}
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            Both you and your friend earn 1,000 quiz points when they join using your link!
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Your Referrals ({referrals.length})</h3>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading referrals...</span>
            </div>
          ) : referrals.length > 0 ? (
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="p-3 rounded-md border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {referral.referred_user?.username || referral.referred_user?.email || "Anonymous User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Joined on {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-medium">+1000 points</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-md text-center">
              <p className="text-muted-foreground mb-2">No referrals yet. Share your link to start earning!</p>
              <p className="text-xs text-gray-500">When someone signs up using your link, they'll appear here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
