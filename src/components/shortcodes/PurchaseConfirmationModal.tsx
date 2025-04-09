
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Share2, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { formatNumberWithCommas } from "@/utils/helpers";

interface PurchaseConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  transactionAmount: string;
  tokenAmount: string;
  tokenSymbol?: string;
}

export const PurchaseConfirmationModal = ({
  open,
  onClose,
  transactionAmount,
  tokenAmount,
  tokenSymbol = "CLAB"
}: PurchaseConfirmationModalProps) => {
  useEffect(() => {
    if (open) {
      // Trigger confetti when the success dialog opens
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };
      
      (function frame() {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) return;
        
        confetti({
          particleCount: 2,
          angle: randomInRange(0, 360),
          spread: randomInRange(50, 100),
          origin: {
            x: randomInRange(0.1, 0.9),
            y: randomInRange(0.1, 0.5)
          },
          colors: ['#9333ea', '#db2777', '#16a34a'],
          zIndex: 10000,
        });
        
        requestAnimationFrame(frame);
      }());
    }
  }, [open]);
  
  const shareOnX = () => {
    const text = `🚀 Just contributed to the Crypto Like A Boss presale! Join me and be part of the CLAB revolution! 🔥`;
    const url = "https://cryptolikeaboss.com/presale";
    const hashtags = "CLAB,crypto,presale";
    
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`,
      "_blank"
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-zinc-900 border border-emerald-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
            Purchase Successful! 🎉
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-center mb-2">
            <div className="bg-emerald-900/30 rounded-full p-3">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          
          <div className="bg-emerald-950/50 p-6 rounded-lg border border-emerald-500/30">
            <div className="text-center space-y-2">
              <p className="text-emerald-300 text-sm">You successfully contributed</p>
              <p className="text-xl font-bold">{transactionAmount}</p>
              
              <div className="mt-4 pt-3 border-t border-emerald-900/50">
                <p className="text-emerald-300 text-sm">You will receive</p>
                <p className="text-xl font-bold text-emerald-400">
                  {Number(tokenAmount).toLocaleString(undefined, {maximumFractionDigits: 0})} {tokenSymbol}
                </p>
              </div>
              
              <div className="mt-4">
                <p className="text-xs text-gray-400">
                  Tokens will be available to claim after the presale ends.
                </p>
                
                <Link 
                  to="/profile?tab=purchases"
                  className="flex items-center justify-center gap-1 mt-3 text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
                >
                  View your purchases <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-300">Share this achievement with your friends!</p>
            
            <div className="flex justify-center">
              <Button 
                onClick={shareOnX}
                variant="outline" 
                className="gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-blue-400"
              >
                <Share2 className="h-4 w-4" />
                Share on X
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
