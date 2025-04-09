
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSession } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { usePremiumStatus } from "@/components/quiz/hooks/usePremiumStatus";
import { usePaymentProcessing } from "@/components/quiz/premium/usePaymentProcessing";

interface PremiumAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgradeComplete?: () => void;
}

export const PremiumAccessDialog = ({
  open,
  onOpenChange,
  onUpgradeComplete,
}: PremiumAccessDialogProps) => {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { isPremium } = usePremiumStatus(session, session?.user?.id || null);
  const { initiatePayment, isProcessing } = usePaymentProcessing();

  useEffect(() => {
    if (!session && open) {
      toast.info("Login required", {
        description: "You need to be logged in to access premium features.",
      });
      onOpenChange(false);
    }
  }, [session, open, onOpenChange]);

  const handleStartPayment = async () => {
    if (!session?.user?.email || !session?.user?.id) {
      toast.error("Email required", {
        description: "Please add an email to your account to continue.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await initiatePayment(session.user.email, session.user.id);
      onOpenChange(false);
      if (onUpgradeComplete) {
        onUpgradeComplete();
      }
    } catch (error: any) {
      toast.error("Payment failed", {
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlock Premium Access</AlertDialogTitle>
          <AlertDialogDescription>
            Upgrade to premium to get access to exclusive content and remove
            ads.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading || isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleStartPayment} disabled={isLoading || isProcessing}>
            {isLoading || isProcessing ? "Processing..." : "Upgrade to Premium"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
