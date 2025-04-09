
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading, checkAdminRole, clearAdminCache } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  // Only show debug info in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const checkAuth = async () => {
      console.log("AdminProtectedRoute - Starting authentication check");
      
      // Add more extensive debugging
      if (isDevelopment) {
        setDebugInfo(prev => ({ ...prev, checkStarted: new Date().toISOString() }));
      }
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (isDevelopment) {
        setDebugInfo(prev => ({ 
          ...prev, 
          sessionCheck: new Date().toISOString(),
          hasSession: !!session
        }));
      }
      
      if (!session) {
        console.log("AdminProtectedRoute - No session found");
        toast({
          title: "Authentication required",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      setUserId(session.user.id);
      
      if (isDevelopment) {
        console.log("AdminProtectedRoute - User authenticated with ID:", session.user.id);
        console.log("AdminProtectedRoute - User email:", session.user.email);
        
        setDebugInfo(prev => ({ 
          ...prev, 
          userId: session.user.id,
          userEmail: session.user.email
        }));
      }
      
      // Clear admin cache on first mount to ensure a fresh check
      if (retryCount === 0) {
        console.log("AdminProtectedRoute - Clearing admin cache");
        clearAdminCache();
      }
      
      // Force a fresh check of admin status
      console.log("AdminProtectedRoute - Performing fresh admin role check");
      const adminCheckResult = await checkAdminRole(true);
      
      if (isDevelopment) {
        setDebugInfo(prev => ({ 
          ...prev, 
          adminCheckCompleted: new Date().toISOString(),
          adminCheckResult
        }));
        
        // Log current admin status after check
        console.log("AdminProtectedRoute - Admin status after check:", isAdmin);
        console.log("AdminProtectedRoute - Loading status:", isLoading);
      }
      
      // If not admin after loading completes, check admin status directly from DB
      if (!isLoading && !isAdmin && retryCount < 3) {
        console.log("AdminProtectedRoute - Not admin, performing direct DB check (retry:", retryCount, ")");
        
        try {
          // Direct check from the database
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
            
          if (isDevelopment) {
            setDebugInfo(prev => ({ 
              ...prev, 
              directDbCheck: new Date().toISOString(),
              userRoles,
              dbCheckError: rolesError ? rolesError.message : null
            }));
          }
          
          if (rolesError) {
            console.error("Direct DB check error:", rolesError);
          } else {
            const hasAdminRole = userRoles && userRoles.some(role => role.role === 'admin');
            
            if (isDevelopment) {
              console.log("AdminProtectedRoute - Direct DB check result:", userRoles);
              console.log("AdminProtectedRoute - Has admin role per DB:", hasAdminRole);
              
              setDebugInfo(prev => ({ 
                ...prev, 
                hasAdminRole
              }));
            }
            
            if (hasAdminRole && !isAdmin) {
              // If DB shows admin but hook doesn't, force a retry
              console.log("AdminProtectedRoute - Detected admin role in DB but not in state, retrying");
              setRetryCount(prev => prev + 1);
              // Force cache clear and recheck
              clearAdminCache();
              
              // Refresh token to ensure latest claims
              try {
                await supabase.auth.refreshSession();
                console.log("AdminProtectedRoute - Session refreshed");
                
                if (isDevelopment) {
                  setDebugInfo(prev => ({ 
                    ...prev, 
                    sessionRefreshed: new Date().toISOString()
                  }));
                }
              } catch (refreshError) {
                console.error("Error refreshing session:", refreshError);
                
                if (isDevelopment) {
                  setDebugInfo(prev => ({ 
                    ...prev, 
                    refreshError: refreshError.message
                  }));
                }
              }
              
              return;
            }
          }
        } catch (err) {
          console.error("Error during direct DB check:", err);
          
          if (isDevelopment) {
            setDebugInfo(prev => ({ 
              ...prev, 
              directDbError: err.message
            }));
          }
        }
      }
      
      // Only redirect if we've completed all checks and the user is still not an admin
      if (!isLoading && !isAdmin && retryCount >= 2) {
        console.log("AdminProtectedRoute - Access denied after", retryCount, "retries");
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page. If you were recently granted admin access, please log out and log back in.",
          variant: "destructive",
          duration: 6000
        });
        navigate('/');
      }
    };

    checkAuth();
  }, [isAdmin, isLoading, navigate, toast, checkAdminRole, clearAdminCache, retryCount, isDevelopment]);

  // If still loading, show loading indicator
  if (isLoading || retryCount > 0 && retryCount < 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-lg">Verifying admin access...</p>
        {isDevelopment && userId && (
          <div className="mt-3 text-sm text-gray-500">
            User ID: {userId}
          </div>
        )}
        {isDevelopment && Object.keys(debugInfo).length > 0 && (
          <div className="mt-5 p-4 bg-gray-100 rounded-lg max-w-xl w-full text-xs overflow-auto">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  // If user is not an admin, return null (redirect is handled in the useEffect)
  if (!isAdmin) {
    return null;
  }

  // User is an admin, render the children
  return <>{children}</>;
};
