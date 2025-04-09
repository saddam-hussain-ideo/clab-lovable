import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Rocket, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";

interface QuizComingSoonModalProps {
  adminWalletAddress: string;
}

export function QuizComingSoonModal({ adminWalletAddress }: QuizComingSoonModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { walletAddress } = useWallet();
  
  // Check if the current wallet is the admin wallet to bypass the modal
  const isAdminWallet = walletAddress === adminWalletAddress;

  useEffect(() => {
    // If it's the admin wallet, don't show the modal
    if (isAdminWallet) {
      setIsOpen(false);
    }
  }, [isAdminWallet]);

  return (
    <Dialog 
      open={isOpen && !isAdminWallet} 
      onOpenChange={(open) => {
        // Only allow closing if it's the admin wallet
        if (isAdminWallet) {
          setIsOpen(open);
        } else if (open === true) {
          // Allow opening, but not closing
          setIsOpen(true);
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-md bg-gradient-to-b from-zinc-900 to-black border border-purple-500/30" 
        showCloseButton={false}
        preventCloseOnOutsideClick={true}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-900/30 p-3">
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-white">Quiz Coming Soon!</DialogTitle>
          <DialogDescription className="text-zinc-300 mt-2">
            The crypto quiz feature will be launching in Stage 3 of our presale.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-purple-900/20 rounded-md p-4 my-4 border border-purple-500/20">
          <div className="flex items-start space-x-3">
            <Rocket className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-white">Get Ready for Launch</h4>
              <p className="text-sm text-zinc-300 mt-1">
                Test your crypto knowledge, earn rewards, and climb the leaderboard when our interactive quiz launches in Stage 3.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-900/20 rounded-md p-4 my-2 border border-amber-500/20">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-white">Don't Miss Out</h4>
              <p className="text-sm text-zinc-300 mt-1">
                Participate in our presale now to be among the first to access the quiz when it launches.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-center">
          <Button variant="secondary" asChild className="sm:flex-1">
            <Link to="/">
              Back to Home
            </Link>
          </Button>
          <Button variant="default" asChild className="sm:flex-1 bg-purple-600 hover:bg-purple-700">
            <Link to="/#presale">
              Join Presale
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
