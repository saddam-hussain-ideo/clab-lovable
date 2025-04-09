
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useSession } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { withRetry } from "@/utils/retry/retryUtils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WalletButton } from "@/components/wallet/WalletButton";

interface FavoriteButtonProps {
  articleId: number;
  className?: string;
}

export const FavoriteButton = ({ articleId, className }: FavoriteButtonProps) => {
  const session = useSession();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { isFavorited, toggleFavorite, isToggling, isCheckingFavorite } = useFavorites();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  
  useEffect(() => {
    const storedWalletAddress = localStorage.getItem('walletAddress');
    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
    }
  }, []);
  
  const handleToggleFavorite = useCallback(() => {
    if (!session && !walletAddress) {
      // Show a connection dialog instead of creating a temporary wallet
      setShowConnectDialog(true);
      return;
    }
    
    performFavoriteToggle(walletAddress);
  }, [articleId, session, toggleFavorite, walletAddress]);
  
  const performFavoriteToggle = (address: string | null) => {
    // Perform favorite toggle with retry capability
    withRetry(
      async () => {
        return await toggleFavorite(
          { articleId },
          {
            onSuccess: (result) => {
              // Success handling moved to the useFavorites hook's onSuccess callback
              // to avoid duplicate toasts
            }
          }
        );
      },
      {
        maxRetries: 3,
        minTimeout: 1000,
        factor: 2,
        shouldRetry: (error) => {
          return error.message?.includes('ERR_INSUFFICIENT_RESOURCES') || 
                error.message?.includes('Failed to fetch');
        },
        onRetry: (error, attempt) => {
          console.log(`Retry attempt ${attempt} for favorite toggle due to: ${error.message}`);
          toast({
            title: "Retrying",
            description: `Connection issue, trying again in ${Math.pow(2, attempt-1)} seconds...`,
            variant: "default"
          });
        },
        context: 'favoriteToggle'
      }
    ).catch(error => {
      console.error("Error in favorite toggle after retries:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive"
      });
    });
  };
  
  const handleWalletConnected = (connected: boolean, address?: string | null) => {
    if (connected && address) {
      setWalletAddress(address);
      setShowConnectDialog(false);
      
      // After successful connection, try the favorite action again
      setTimeout(() => {
        performFavoriteToggle(address);
      }, 500);
    }
  };
  
  const isLoading = isToggling || isCheckingFavorite;
  
  return (
    <>
      <Button
        onClick={handleToggleFavorite}
        variant="ghost"
        size="sm"
        disabled={isLoading}
        className={cn(
          "gap-1 px-2", 
          isFavorited ? "text-red-500 hover:text-red-700 hover:bg-red-100/10" : "text-gray-400 hover:text-red-500 hover:bg-red-100/10",
          className
        )}
        title={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart 
          className={cn(
            "h-5 w-5", 
            isLoading && "animate-pulse",
            isFavorited && "fill-current"
          )} 
        />
        <span className="sr-only">{isFavorited ? "Remove from favorites" : "Add to favorites"}</span>
      </Button>
      
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border-purple-500/30 bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Connect Wallet to Favorite</DialogTitle>
            <DialogDescription>
              You need to connect a wallet to save articles to your favorites. 
              This allows you to access your favorite content across devices.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect with any of our supported wallets to continue.
            </p>
            
            <WalletButton 
              variant="default" 
              className="w-full justify-center py-6"
              onConnectChange={handleWalletConnected}
              useModal={true}
            />
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConnectDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
