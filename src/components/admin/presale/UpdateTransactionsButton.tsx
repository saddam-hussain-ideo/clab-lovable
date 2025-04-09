
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateTransactionsButtonProps {
  onSuccess?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const UpdateTransactionsButton = ({ 
  onSuccess, 
  variant = "default",
  size = "default"
}: UpdateTransactionsButtonProps) => {
  const [loading, setLoading] = useState(false);
  
  const triggerUpdate = async () => {
    setLoading(true);
    
    try {
      toast.info("Updating transactions...");
      
      const { data, error } = await supabase.functions.invoke('trigger-contribution-updates', {
        body: { network: 'all' }
      });
      
      if (error) throw error;
      
      const updatedCount = data?.result?.updated || 0;
      toast.success(`Successfully updated ${updatedCount} contribution${updatedCount !== 1 ? 's' : ''}`);
      
      if (updatedCount === 0) {
        toast.info("No transactions needed updating. Either they're already processed or no transaction hash is available.");
      }
      
      if (data?.result?.errors && data.result.errors.length > 0) {
        console.warn("Some transactions had errors:", data.result.errors);
        toast.warning(`${data.result.errors.length} transaction(s) could not be updated`);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating transactions:', error);
      toast.error('Failed to update transactions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      onClick={triggerUpdate}
      disabled={loading}
      variant={variant}
      size={size}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
        </>
      ) : (
        "Update Pending Transactions"
      )}
    </Button>
  );
};
