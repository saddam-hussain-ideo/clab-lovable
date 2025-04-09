
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RpcStatusCard } from '@/components/admin/RpcStatusCard';
import { TransactionUpdateStatus } from '@/components/admin/presale/TransactionUpdateStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PresaleSettings } from '@/components/admin/presale/PresaleSettings';
import { RpcConfigDialog } from '@/components/admin/settings/RpcConfigDialog';
import { EthereumRpcConfigDialog } from '@/components/admin/settings/EthereumRpcConfigDialog';
import { EthereumRpcStatusCard } from '@/components/admin/EthereumRpcStatusCard';
import { useLocation, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  console.log("AdminDashboard component is rendering");
  const [activeNetwork, setActiveNetwork] = useState('mainnet');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine the initial active tab based on URL parameters
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'settings' ? 'settings' : 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update URL when tab changes
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'settings') {
      navigate('/admin?tab=settings', { replace: true });
    } else {
      navigate('/admin', { replace: true });
    }
  };
  
  // Listen for URL changes
  useEffect(() => {
    const newTab = queryParams.get('tab') === 'settings' ? 'settings' : 'dashboard';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.search]);
  
  const refetchSettings = async () => {
    setIsLoading(true);
    try {
      // Mock fetch for now until the settings API is implemented
      setSettings({
        token_name: "CLAB",
        token_price: 0.00025,
        min_purchase: 0.1,
        contract_address: "",
      });
      return settings;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNetworkChange = (network) => {
    setActiveNetwork(network);
  };
  
  // Fetch settings on initial render
  useEffect(() => {
    refetchSettings();
  }, []);
  
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Transaction Update Status Card */}
            <div className="col-span-1 md:col-span-2">
              <TransactionUpdateStatus />
            </div>
            
            {/* RPC Status Card */}
            <div className="col-span-1">
              <RpcStatusCard />
            </div>
            
            {/* Dashboard Summary Card */}
            <Card className="col-span-1 md:col-span-1">
              <CardHeader>
                <CardTitle>Welcome to the Admin Dashboard</CardTitle>
                <CardDescription>
                  Manage your site content and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Select an option from the sidebar to get started.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Configure your application settings including general configuration, system preferences, and advanced options.
              </p>
              
              <div className="mb-6 flex flex-wrap gap-2">
                <RpcConfigDialog />
                <EthereumRpcConfigDialog />
              </div>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
                <RpcStatusCard />
                <EthereumRpcStatusCard />
              </div>
              
              <PresaleSettings
                settings={settings}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                refetchSettings={refetchSettings}
                activeNetwork={activeNetwork}
                onNetworkChange={handleNetworkChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
