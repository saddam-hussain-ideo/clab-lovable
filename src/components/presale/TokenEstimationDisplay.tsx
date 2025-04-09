import { Card } from "@/components/ui/card";

interface TokenEstimationDisplayProps {
  tokenAmount: number;
  currency: string;
  inputAmount: string;
  loading?: boolean;
}

export function TokenEstimationDisplay({ 
  tokenAmount, 
  currency, 
  inputAmount,
  loading = false 
}: TokenEstimationDisplayProps) {
  const formattedTokens = Number.isNaN(tokenAmount) ? '0' : 
    tokenAmount.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  
  return (
    <Card className="bg-background/10 border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">You will receive</span>
          <div className="flex items-center mt-1">
            {loading ? (
              <div className="animate-pulse h-8 w-32 bg-background/20 rounded"></div>
            ) : (
              <span className="text-2xl font-medium bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                {formattedTokens} CLAB
              </span>
            )}
          </div>
        </div>
        <div className="bg-purple-500/10 px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-purple-400">
            Estimated
          </span>
        </div>
      </div>
    </Card>
  );
}
