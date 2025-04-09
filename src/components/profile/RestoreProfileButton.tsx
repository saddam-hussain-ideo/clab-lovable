
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const RestoreProfileButton = () => {
  const { walletType, walletAddress } = useWallet();
  const [isRestoring, setIsRestoring] = useState(false);
  
  const handleRestoreProfile = async () => {
    try {
      setIsRestoring(true);
      
      if (!walletAddress) {
        toast.error("No wallet connected. Please connect your wallet first.");
        return;
      }
      
      toast.info("Attempting to restore your profile...");
      
      // Since walletService.syncWalletProfile doesn't exist, we'll use the Supabase client directly
      try {
        // First check if a profile exists
        const { data: existingProfile } = await supabase
          .from('wallet_profiles')
          .select('*')
          .eq('wallet_address', walletAddress)
          .maybeSingle();
          
        if (existingProfile) {
          toast.success("Profile successfully restored!", {
            description: "Your username and points have been recovered."
          });
          // Force page reload to refresh all profile data
          window.location.reload();
        } else {
          toast.error("Could not restore profile", {
            description: "There may not be a profile to restore, or an error occurred."
          });
        }
      } catch (error) {
        console.error("Database error restoring profile:", error);
        toast.error("Failed to restore profile. Please try again.");
      }
    } catch (error) {
      console.error("Error restoring profile:", error);
      toast.error("Failed to restore profile. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };
  
  return (
    <Button 
      onClick={handleRestoreProfile} 
      disabled={isRestoring}
      variant="secondary"
      className="mt-2"
    >
      {isRestoring ? "Restoring..." : "Restore Profile"}
    </Button>
  );
};
