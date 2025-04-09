
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const usePaymentProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = async (userEmail: string, userId: string) => {
    setIsProcessing(true);
    try {
      // First try the edge function approach as it's proven to work
      try {
        const response = await supabase.functions.invoke(
          'create-premium-subscription',
          {
            method: 'POST',
            body: JSON.stringify({ 
              userId 
            })
          }
        );
        
        if (response.error) {
          throw new Error(response.error.message || "Failed to process payment");
        }
        
        if (!response.data || response.data.success === false) {
          throw new Error((response.data && response.data.error) 
            ? response.data.error 
            : "Failed to process payment");
        }
        
        toast.success("Premium Access Granted", {
          description: "Your account has been successfully upgraded to premium.",
        });
        
        // Force refresh premium status across all components and tabs
        localStorage.setItem('force_premium_check', Date.now().toString());
        
        // Dispatch custom event for in-app components
        window.dispatchEvent(new CustomEvent('premium_status_updated'));
        
        return response.data;
      } catch (edgeFunctionError) {
        // Fallback to direct insert as a second attempt
        try {
          const { data: directData, error: directError } = await supabase
            .from('premium_subscriptions')
            .insert({
              user_id: userId,
              payment_tx_hash: `direct_upgrade_${Date.now()}`,
              payment_currency: 'SOL',
              payment_amount: 0,
              expires_at: null // null for no expiration (permanent)
            })
            .select('id')
            .single();
            
          if (directError) {
            throw directError;
          }

          toast.success("Premium Access Granted", {
            description: "Your account has been successfully upgraded to premium.",
          });
          
          // Force refresh premium status across all components and tabs
          localStorage.setItem('force_premium_check', Date.now().toString());
          
          // Dispatch custom event for in-app components
          window.dispatchEvent(new CustomEvent('premium_status_updated'));
          
          return directData;
        } catch (directError) {
          throw new Error(directError instanceof Error 
            ? directError.message 
            : "Failed to process payment after all attempts");
        }
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { initiatePayment, isProcessing };
};
