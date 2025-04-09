import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { EnhancedUser } from "@/hooks/useUserManager";
import { Switch } from "@/components/ui/switch";
import { Loader2, Shield, Crown, CreditCard, MessageCircle, X, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserDetailProps {
  user: EnhancedUser;
  onUserUpdated: () => void;
}

export const UserDetail = ({ user, onUserUpdated }: UserDetailProps) => {
  const { toast } = useToast();
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [localIsPremium, setLocalIsPremium] = useState(user.isPremium);
  
  useEffect(() => {
    setLocalIsPremium(user.isPremium);
  }, [user.isPremium]);
  
  useEffect(() => {
    const handlePremiumUpdated = () => {
      console.log("Premium status update detected in UserDetail");
      onUserUpdated();
    };
    
    window.addEventListener('premium_status_updated', handlePremiumUpdated);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'force_premium_check' && e.newValue) {
        console.log("Storage event for premium detected in UserDetail");
        onUserUpdated();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('premium_status_updated', handlePremiumUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [onUserUpdated]);
  
  const makeAdmin = async (userId: string) => {
    setIsAdminLoading(true);
    try {
      try {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
      } catch (clearError) {
        console.warn("Error clearing existing admin role:", clearError);
      }
      
      const { error } = await supabase
        .from('user_roles')
        .insert([
          { user_id: userId, role: 'admin' }
        ]);

      if (error) {
        console.error("Admin role assignment error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "User has been made an admin",
      });
      
      localStorage.setItem('admin_status_changed', Date.now().toString());
      
      window.dispatchEvent(new CustomEvent('admin_status_changed', {
        detail: { userId, isAdmin: true }
      }));
      
      onUserUpdated();
      
      toast({
        title: "Action Required",
        description: "The user must log out and log back in for the admin role to take effect.",
        duration: 6000
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign admin role",
        variant: "destructive",
      });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const removeAdmin = async (userId: string) => {
    setIsAdminLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        console.error("Admin role removal error:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Admin role has been removed from user",
      });
      
      localStorage.setItem('admin_status_changed', Date.now().toString());
      
      window.dispatchEvent(new CustomEvent('admin_status_changed', {
        detail: { userId, isAdmin: false }
      }));
      
      onUserUpdated();
      
      toast({
        title: "Action Required",
        description: "The user must log out and log back in for the admin role removal to take effect.",
        duration: 6000
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove admin role",
        variant: "destructive",
      });
    } finally {
      setIsAdminLoading(false);
    }
  };

  const togglePremiumStatus = async () => {
    setIsPremiumLoading(true);
    console.log("Toggling premium status:", user.id, "Current status:", user.isPremium);
    
    try {
      if (user.isPremium) {
        const { error } = await supabase
          .from('premium_subscriptions')
          .delete()
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Premium removal error:", error);
          throw error;
        }
        
        setLocalIsPremium(false);
        toast({
          title: "Premium removed",
          description: "Premium subscription has been removed from this user",
        });
      } else {
        console.log("Using edge function to grant premium status");
        const response = await supabase.functions.invoke(
          'create-premium-subscription',
          {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          }
        );
          
        console.log("Edge function response:", response);
          
        if (response.error) {
          console.error("Edge function error:", response.error);
          throw new Error(response.error.message || "Failed to grant premium status");
        }
          
        if (!response.data || response.data.success === false) {
          console.error("Edge function unsuccessful:", response.data);
          throw new Error((response.data && response.data.error) ? response.data.error : "Failed to grant premium status");
        }
          
        console.log("Premium subscription created via edge function");
        setLocalIsPremium(true);
        toast({
          title: "Premium granted",
          description: "Premium subscription has been granted to this user",
        });
      }
      
      localStorage.setItem('force_premium_check', Date.now().toString());
      
      window.dispatchEvent(new CustomEvent('premium_status_updated'));
      
      onUserUpdated();
    } catch (error: any) {
      console.error("Failed to toggle premium:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to modify premium status",
        variant: "destructive",
      });
    } finally {
      setIsPremiumLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch 
            id="premium-status"
            checked={localIsPremium}
            onCheckedChange={togglePremiumStatus}
            disabled={isPremiumLoading}
          />
          <div className="flex flex-col">
            <label 
              htmlFor="premium-status" 
              className="text-sm font-medium flex items-center"
            >
              <Crown className={`h-4 w-4 mr-1 ${localIsPremium ? 'text-yellow-500' : 'text-gray-400'}`} />
              Premium Status
            </label>
            <Badge 
              variant={localIsPremium ? "success" : "secondary"} 
              className={`mt-1 ${localIsPremium ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/20'}`}
            >
              {localIsPremium ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </div>
        {isPremiumLoading && (
          <div className="flex items-center text-xs text-gray-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>
      
      <Button
        onClick={async () => {
          if (user.isAdmin) {
            await removeAdmin(user.id);
          } else {
            await makeAdmin(user.id);
          }
        }}
        disabled={isAdminLoading}
        variant={user.isAdmin ? "destructive" : "default"}
        className="flex items-center"
      >
        {isAdminLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            {user.isAdmin ? 'Remove Admin Role' : 'Make Admin'}
          </>
        )}
      </Button>

      {user.defiWaitlist && (
        <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5 mt-2">
          <h3 className="text-sm font-semibold flex items-center">
            <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
            DeFi Card Waitlist Information
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            {user.defiWaitlist.name && (
              <div className="flex items-center space-x-2">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-300">{user.defiWaitlist.name}</span>
              </div>
            )}
            {user.defiWaitlist.discord && (
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-gray-300">{user.defiWaitlist.discord}</span>
              </div>
            )}
            {user.defiWaitlist.twitter && (
              <div className="flex items-center space-x-2">
                <X className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-gray-300">{user.defiWaitlist.twitter}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
