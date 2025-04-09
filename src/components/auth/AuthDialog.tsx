import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { AuthForm } from "./AuthForm";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AuthDialogProps {
  className?: string;
  children?: ReactNode;
}

export const AuthDialog = ({ className = "", children }: AuthDialogProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      
      // Clear any logging out state when auth state changes
      if (event === 'SIGNED_OUT') {
        setIsLoggingOut(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Remove headers property as it's not supported
      const { error } = await supabase.auth.signOut({ 
        scope: 'global'
      });
      
      if (error && !error.message.includes('session missing')) {
        // Only throw if it's not a "session missing" error
        throw error;
      }
      
      // Even if there's a "session missing" error, we still want to clean up
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      
      // Clear any stored auth data from local storage
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('adminRoleData');
        localStorage.removeItem('isAdmin');
        sessionStorage.removeItem('adminRoleData');
        sessionStorage.removeItem('isAdmin');
      } catch (e) {
        console.warn('Error clearing local storage:', e);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to log out",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
      setIsLoggedIn(false);
    }
  };

  if (isLoggedIn) {
    return (
      <Button variant="default" className={className} onClick={handleLogout} disabled={isLoggingOut}>
        <LogOut className="mr-2 h-4 w-4" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className={className}>
          {children || (
            <>
              <UserCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Login/Sign Up</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Login' : 'Create an Account'}</DialogTitle>
        </DialogHeader>
        <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
      </DialogContent>
    </Dialog>
  );
};
