import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileTabs } from "@/hooks/useProfileTabs";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { useEffect, useCallback, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { forceGlobalReset } from "@/utils/globalReset";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Re-export the Profile type from the types file for backward compatibility
export type { Profile } from "@/types/profile";

const Profile = () => {
  const { profile, setProfile, loading, refreshProfile } = useProfileData();
  const { activeTab, handleTabChange } = useProfileTabs({ defaultTab: 'info' });
  const { toast } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      toast({
        title: "Refreshing profile...",
        description: "Fetching latest data from wallet",
        duration: 3000
      });
      
      // Clear existing profile data first
      setProfile(null);
      
      // Force a complete refresh
      await refreshProfile(true);
      
      toast({
        title: "Profile refreshed successfully",
        description: "Showing latest data from your wallet",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Error refreshing profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [setProfile, refreshProfile, toast]);

  const handleForceReset = useCallback(async () => {
    try {
      toast({
        title: "Resetting wallet data...",
        description: "Clearing all wallet data and reloading",
        duration: 3000
      });
      
      await forceGlobalReset();
      
      // The page will reload automatically after reset
    } catch (error) {
      toast({
        title: "Error resetting wallet data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [toast]);

  useEffect(() => {
    // Log profile data when it changes for debugging
    console.log("[Profile] Profile data loaded:", profile);
    if (!profile) {
      console.log("[Profile] No profile data, refreshing...");
      refreshProfile(true);
    }
  }, [profile, refreshProfile]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
          <div className="container mx-auto px-4 pt-24">
            <Card className="p-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-white">Loading profile...</span>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">Profile</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Force Reset
              </Button>
            </div>
          </div>
          
          <div className="w-full max-w-4xl mx-auto">
            <ProfileTabs 
              activeTab={activeTab} 
              onChange={(value) => handleTabChange(value)}
            />
            <ProfileContent 
              profile={profile} 
              setProfile={setProfile} 
              activeTab={activeTab}
            />
          </div>
        </div>
      </main>
      <Footer />
      
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Force Reset Wallet Data</DialogTitle>
            <DialogDescription>
              This will clear ALL wallet data and reload the application. 
              Use this only if you're experiencing issues with wallet connections 
              or seeing data from previous wallets.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-md my-2">
            <p className="text-red-500 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Warning: This will clear all local data and disconnect your wallet. You will need to reconnect after the reset.</span>
            </p>
          </div>
          <DialogFooter className="flex sm:justify-between">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              setShowResetDialog(false);
              handleForceReset();
            }}>
              Reset All Wallet Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
