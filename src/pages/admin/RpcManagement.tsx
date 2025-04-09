
import React, { useRef, useEffect, useState } from 'react';
import { Layout } from "@/components/Layout";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { useAdminNavigation } from "@/hooks/useAdminNavigation";
import RpcManagementPage from "@/components/admin/RpcManagementPage";
import { useLocation } from "react-router-dom";
import { RpcProvider } from "@/contexts/RpcContext";

const AdminRpcManagement = () => {
  const { activeTab, handleTabChange } = useAdminNavigation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);
  const location = useLocation();
  const initialMountRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);

  // Check screen size and adjust sidebar visibility
  React.useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    // Short timeout to ensure components mount properly
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => {
      window.removeEventListener("resize", checkScreenSize);
      clearTimeout(timer);
    };
  }, []);

  // Set rpc active on mount but ONLY if we're not already on the rpc tab
  // and ONLY on the initial mount to prevent refresh loops
  React.useEffect(() => {
    if (initialMountRef.current && location.pathname.includes('/admin/rpc') && activeTab !== 'rpc') {
      console.log('Setting active tab to rpc');
      handleTabChange('rpc');
      initialMountRef.current = false;
    }
  }, [activeTab, handleTabChange, location.pathname]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin mb-2"></div>
            <p>Loading RPC management...</p>
          </div>
        </div>
      </Layout>
    );
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
          
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <RpcManagementPage />
            </div>
          </div>
        </div>
      </RpcProvider>
    </Layout>
  );
};

export default AdminRpcManagement;
