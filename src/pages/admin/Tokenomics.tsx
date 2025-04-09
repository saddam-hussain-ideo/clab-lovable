
import React, { useEffect, useRef } from 'react';
import { Layout } from "@/components/Layout";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { TokenomicsManager } from "@/components/admin/TokenomicsManager";
import { useAdminNavigation } from "@/hooks/useAdminNavigation";
import { useLocation } from "react-router-dom";

const AdminTokenomics = () => {
  const { activeTab, handleTabChange } = useAdminNavigation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);
  const location = useLocation();
  const initialMountRef = useRef(true);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Set tokenomics active on mount but ONLY if we're not already on the tokenomics tab
  // and ONLY on the initial mount to prevent refresh loops
  useEffect(() => {
    if (initialMountRef.current && location.pathname.includes('/admin/tokenomics') && activeTab !== 'tokenomics') {
      console.log('Setting active tab to tokenomics');
      handleTabChange('tokenomics');
      initialMountRef.current = false;
    }
  }, [activeTab, handleTabChange, location.pathname]);

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white flex">
        <AdminSidebar 
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleTabChange={handleTabChange}
          isMobile={isMobile}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Tokenomics Management</h1>
            </div>
            
            <TokenomicsManager />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminTokenomics;
