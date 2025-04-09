
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ReferralProcessor } from "@/components/auth/ReferralProcessor";
import { DebugPanel } from "@/components/auth/DebugPanel";
import { AuthCallbackStatus } from "@/components/auth/AuthCallbackStatus";

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [debug, setDebug] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for admin redirect parameter
  const queryParams = new URLSearchParams(location.search);
  const redirectToAdmin = queryParams.get('admin') === 'true';

  // Create a function to add debug messages to avoid passing setState directly
  const addDebugMessage = useCallback((message: string) => {
    setDebug(prev => [...prev, message]);
    console.log("Auth Debug:", message);
  }, []);

  useEffect(() => {
    const handleAuthCallback = async () => {
      addDebugMessage("Starting auth callback process");
      
      // Retrieve the origin that initiated the auth flow
      const authOrigin = localStorage.getItem('auth_origin') || window.location.origin;
      addDebugMessage(`Auth origin: ${authOrigin}`);
      addDebugMessage(`Current origin: ${window.location.origin}`);

      if (redirectToAdmin) {
        addDebugMessage("Admin redirect parameter detected");
      }
      
      try {
        // Clear any stored role cache first
        try {
          localStorage.removeItem('adminRoleData');
          localStorage.removeItem('isAdmin');
          sessionStorage.removeItem('adminRoleData');
          sessionStorage.removeItem('isAdmin');
          addDebugMessage("Cleared admin role cache");
        } catch (e) {
          addDebugMessage(`Error clearing admin cache: ${e.message}`);
        }
        
        // Process the magic link
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          addDebugMessage(`Auth error: ${error.message}`);
          throw error;
        }

        // Check if user is authenticated
        if (data?.session) {
          const { user } = data.session;
          addDebugMessage(`User authenticated: ${user.id}`);
          setUserId(user.id);
          
          // First check directly in the user_roles table
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
            
          if (rolesError) {
            addDebugMessage(`Error checking user_roles table: ${rolesError.message}`);
            console.error("Error checking user_roles table:", rolesError);
          } else {
            const isUserAdmin = userRoles && userRoles.some(r => r.role === 'admin');
            addDebugMessage(`User roles from table: ${JSON.stringify(userRoles)}`);
            addDebugMessage(`Has admin role from table: ${isUserAdmin}`);
            
            // Store admin status in localStorage
            if (isUserAdmin) {
              try {
                const adminData = JSON.stringify({
                  isAdmin: true,
                  userId: user.id,
                  timestamp: Date.now()
                });
                localStorage.setItem('adminRoleData', adminData);
                sessionStorage.setItem('adminRoleData', adminData);
                localStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('isAdmin', 'true');
                addDebugMessage("Stored admin status in localStorage and sessionStorage");
              } catch (e) {
                addDebugMessage(`Error storing admin status: ${e.message}`);
              }
            }
          }
          
          // Check if user has admin role using RPC function
          const { data: roleData, error: roleError } = await supabase.rpc('has_role', {
            user_id: user.id,
            required_role: 'admin'
          });
          
          if (roleError) {
            addDebugMessage(`Role check error: ${roleError.message}`);
            console.error("Error checking admin role:", roleError);
          } else {
            addDebugMessage(`Admin role check result from RPC: ${roleData}`);
            
            // Double-check storage of admin status
            if (roleData === true) {
              try {
                const adminData = JSON.stringify({
                  isAdmin: true,
                  userId: user.id,
                  timestamp: Date.now()
                });
                localStorage.setItem('adminRoleData', adminData);
                sessionStorage.setItem('adminRoleData', adminData);
                localStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('isAdmin', 'true');
                addDebugMessage("Stored admin status from RPC in localStorage and sessionStorage");
              } catch (e) {
                addDebugMessage(`Error storing admin status from RPC: ${e.message}`);
              }
            }
          }
          
          toast({
            title: "Success",
            description: "You've successfully signed in!",
          });
          
          // Reload the session to ensure fresh token with updated claims
          try {
            await supabase.auth.refreshSession();
            addDebugMessage("Session refreshed successfully");
          } catch (refreshError) {
            addDebugMessage(`Error refreshing session: ${refreshError.message}`);
          }
          
          // Ensure we redirect to the correct origin's admin or home page
          const baseUrl = window.location.origin;
          addDebugMessage(`Redirecting with base URL: ${baseUrl}`);
          
          // Determine if user is admin based on previous checks
          const isUserAdmin = userRoles && userRoles.some(r => r.role === 'admin') || roleData === true;
          
          // Redirect with a slight delay to ensure toast is visible
          if (isUserAdmin || redirectToAdmin) {
            addDebugMessage("User is admin or admin redirect requested, redirecting to admin page");
            setTimeout(() => {
              navigate("/admin", { replace: true });
            }, 1500);
          } else {
            addDebugMessage("User is not admin, redirecting to home page");
            setTimeout(() => {
              navigate("/", { replace: true });
            }, 1500);
          }
        } else {
          addDebugMessage("No session found");
          setError("Authentication failed - no session found");
          navigate("/login", { replace: true });
        }
      } catch (error: any) {
        console.error("Error with auth callback:", error);
        addDebugMessage(`Caught error: ${error.message}`);
        setError(error.message || "An error occurred during authentication");
        toast({
          title: "Error",
          description: error.message || "Authentication failed",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast, addDebugMessage, redirectToAdmin]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md w-full p-6">
        <AuthCallbackStatus error={error} processing={processing} />
        
        {userId && <ReferralProcessor userId={userId} addDebugMessage={addDebugMessage} />}
        
        <DebugPanel messages={debug} />
      </div>
    </div>
  );
};

export default AuthCallback;
