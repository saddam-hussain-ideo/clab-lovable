import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Diamond, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";

interface PresaleUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PresaleUpgradeDialog = ({ 
  open, 
  onOpenChange 
}: PresaleUpgradeDialogProps) => {
  const location = useLocation();
  const isTokenomicsPage = location.pathname === "/tokenomics";

  const handlePresaleClick = () => {
    onOpenChange(false);
    
    // If already on tokenomics page, scroll to the presale section
    if (isTokenomicsPage) {
      const presaleElement = document.querySelector('.token-presale-widget');
      if (presaleElement) {
        presaleElement.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    
    // Otherwise navigate to the homepage presale section
    window.location.href = '/#presale';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-gradient-to-b from-black to-zinc-900 border-zinc-800"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Diamond className="h-6 w-6 text-emerald-400" />
            Upgrade to Unlimited Quiz Access
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <h3 className="font-medium text-emerald-400 mb-1">You've reached the free quiz limit</h3>
            <p className="text-gray-300 text-sm">
              You've completed 5 rounds of free quizzes. Purchase CLAB tokens during our presale to get unlimited quiz access and earn more rewards!
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-1 rounded-full">
                <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-gray-200 text-sm">Unlimited quiz rounds</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-1 rounded-full">
                <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-gray-200 text-sm">Earn CLAB tokens through quiz points</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-1 rounded-full">
                <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-gray-200 text-sm">Access to exclusive premium content</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-gray-400"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handlePresaleClick}
            className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white px-4 group"
          >
            <span>Join Presale Now</span>
            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
