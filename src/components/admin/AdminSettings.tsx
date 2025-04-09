
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PresaleSettings } from "@/components/admin/presale/PresaleSettings";
import { useAdminNavigation } from "@/hooks/useAdminNavigation";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { RpcConfigDialog } from "@/components/admin/settings/RpcConfigDialog";
import { EthereumRpcConfigDialog } from "@/components/admin/settings/EthereumRpcConfigDialog";
import { supabase } from "@/lib/supabase";

export function AdminSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const { activeTab, handleTabChange } = useAdminNavigation();
  const [activeNetwork, setActiveNetwork] = useState(() => {
    try {
      return localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet' : 'testnet';
    } catch (e) {
      console.error("Error reading activeNetwork from localStorage:", e);
      return 'testnet'; // Default fallback
    }
  });
  const location = useLocation();
  const initialMountRef = useRef(true);

  // Set settings tab active on mount but ONLY if we're not already on the settings tab
  // and ONLY on the initial mount to prevent refresh loops
  useEffect(() => {
    if (initialMountRef.current && location.pathname.includes('/admin/settings') && activeTab !== 'settings') {
      console.log('Setting active tab to settings');
      handleTabChange('settings');
      initialMountRef.current = false;
    }
  }, [activeTab, handleTabChange, location.pathname]);

  const refetchSettings = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching presale settings for network:", activeNetwork);
      const { data, error } = await supabase
        .from('presale_settings')
        .select('*')
        .eq('id', activeNetwork === 'mainnet' ? 'default' : 'testnet')
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching presale settings:", error);
        toast.error("Failed to load settings");
        return null;
      }
      
      console.log("Fetched presale settings:", data);
      
      if (data) {
        // Override min_purchase with hardcoded value
        const settingsWithHardcodedMinPurchase = {
          ...data,
          min_purchase: 0.001 // Updated to 0.001
        };
        
        console.log("Settings with hardcoded min_purchase:", settingsWithHardcodedMinPurchase);
        setSettings(settingsWithHardcodedMinPurchase);
        return settingsWithHardcodedMinPurchase;
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          token_name: "CLAB",
          token_price: 0.00025,
          min_purchase: 0.001, // Updated hardcoded min_purchase
          contract_address: "",
        };
        setSettings(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchSettings();
  }, [activeNetwork]);

  const handleNetworkChange = (network: 'mainnet' | 'testnet') => {
    console.log("Changing network to:", network);
    setActiveNetwork(network);
    try {
      localStorage.setItem('activeNetwork', network);
    } catch (e) {
      console.error("Error saving activeNetwork to localStorage:", e);
    }
  };

  return (
    <div className="space-y-6">
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
    </div>
  );
}
