
import React, { useState, useEffect } from 'react';
import { Layout } from "@/components/Layout";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminContent } from "@/components/admin/layout/AdminContent";
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { useAdminNavigation } from "@/hooks/useAdminNavigation";
import { getAdminMenuItems } from "@/components/admin/layout/menuItems";
import { toast } from "sonner";
import { RpcProvider } from "@/contexts/RpcContext";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const { activeTab, handleTabChange } = useAdminNavigation();

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          console.log("No session found, redirecting to login");
          navigate('/admin-login');
          return;
        }

        try {
          const { data: userRoles, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);

          if (error) {
            console.error("Error checking admin status:", error);
            toast.error("Error checking admin status");
            throw error;
          }

          const hasAdminRole = userRoles && userRoles.some(r => r.role === 'admin');
          console.log("Admin role check:", hasAdminRole, userRoles);
          setIsAdmin(hasAdminRole);

          if (!hasAdminRole) {
            toast.error("Access denied. You need admin privileges to access this page.");
            navigate('/');
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          toast.error("Error checking admin privileges");
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate, location]);

  useEffect(() => {
    console.log("Current admin path:", location.pathname);
    console.log("Active tab:", activeTab);
  }, [location.pathname, activeTab]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin mb-2"></div>
        <p>Loading admin panel...</p>
      </div>
    </div>;
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="p-6 bg-gray-800 rounded-lg max-w-md text-center">
        <h2 className="text-xl font-bold mb-3">Access denied</h2>
        <p className="mb-4">Admin privileges required to access this page.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>;
  }

  return (
    <Layout>
      <RpcProvider>
        <div className="min-h-screen bg-black text-white flex">
          <AdminSidebar 
            activeTab={activeTab}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            handleTabChange={handleTabChange}
            isMobile={isMobile}
          />
          
          <AdminContent />
        </div>
      </RpcProvider>
    </Layout>
  );
};

export default Admin;
