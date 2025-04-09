import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SimpleEditor } from "@/components/admin/presale/SimpleEditor";
import { CountdownSettings } from "@/components/admin/presale/CountdownSettings";

interface PresaleSettingsProps {
  settings: any;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refetchSettings: () => Promise<any>;
  activeNetwork: string;
  onNetworkChange: (network: 'mainnet' | 'testnet') => void;
  walletConnected?: boolean;
  wallet?: any;
  onTokenInfoUpdated?: () => void;
}

export const PresaleSettings = ({
  settings,
  isLoading,
  setIsLoading,
  refetchSettings,
  activeNetwork,
  onNetworkChange,
  walletConnected,
  wallet,
  onTokenInfoUpdated
}: PresaleSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<{
    token_name: string;
    token_price: number;
    min_purchase: number;
    contract_address: string;
  }>({
    token_name: "CLAB",
    token_price: 0.00025,
    min_purchase: 0.001, // Updated default min_purchase to 0.001
    contract_address: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  useEffect(() => {
    if (settings) {
      console.log("Updating local settings from props:", settings);
      setLocalSettings({
        token_name: settings.token_name || "CLAB",
        token_price: settings.token_price || 0.00025,
        min_purchase: 0.001, // Always set min_purchase to 0.001 regardless of what comes from the database
        contract_address: settings.contract_address || "",
      });
      setIsLoaded(true);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      console.log("Saving settings for network:", activeNetwork);
      console.log("Settings to save:", localSettings);
      
      // Ensure min_purchase is always 0.001
      const settingsToSave = {
        ...localSettings,
        min_purchase: 0.001, // Force min_purchase to be 0.001
        token_price: Number(localSettings.token_price)
      };
      
      console.log("Settings after hardcoding min_purchase:", settingsToSave);
      
      const { error } = await supabase
        .from('presale_settings')
        .upsert(
          [
            {
              id: activeNetwork === 'mainnet' ? 'default' : 'testnet',
              token_name: settingsToSave.token_name,
              token_price: settingsToSave.token_price,
              min_purchase: settingsToSave.min_purchase,
              contract_address: settingsToSave.contract_address,
              updated_at: new Date().toISOString() // Add timestamp to ensure the row is updated
            },
          ],
          { onConflict: 'id' }
        );

      if (error) {
        console.error("Error saving presale settings:", error);
        toast.error("Failed to save presale settings.");
        return;
      }

      toast.success("Presale settings saved successfully.");
      
      if (refetchSettings) {
        console.log("Refetching settings after save");
        const updatedSettings = await refetchSettings();
        console.log("Updated settings after refetch:", updatedSettings);
      }
      
      if (onTokenInfoUpdated) {
        onTokenInfoUpdated();
      }
    } catch (error) {
      console.error("Error saving presale settings:", error);
      toast.error("Failed to save presale settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(localSettings.contract_address);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleNetworkChange = (network: 'mainnet' | 'testnet') => {
    if (onNetworkChange) {
      console.log("Changing network from PresaleSettings to:", network);
      onNetworkChange(network);
    }
  };
  
  const handleInputChange = (field: string, value: string | number) => {
    console.log(`Updating ${field} to:`, value);
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <Tabs defaultValue="general" className="w-full space-y-6">
      <TabsList className="grid grid-cols-3 md:w-auto w-full">
        <TabsTrigger value="general">General Settings</TabsTrigger>
        <TabsTrigger value="wallet">Wallet Settings</TabsTrigger>
        <TabsTrigger value="countdown">Countdown</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="space-y-6">
        <Card className="admin-card">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure general presale settings such as token name and price.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                className="admin-form-input"
                value={localSettings.token_name}
                onChange={(e) => handleInputChange('token_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token-price">Token Price (SOL)</Label>
              <Input
                id="token-price"
                type="number"
                step="0.00001"
                className="admin-form-input"
                value={localSettings.token_price}
                onChange={(e) => handleInputChange('token_price', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-purchase">Minimum Purchase (SOL)</Label>
              <Input
                id="min-purchase"
                type="number"
                step="0.001"
                className="admin-form-input"
                value={0.001}
                disabled={true}
                readOnly={true}
              />
              <p className="text-xs text-muted-foreground">Fixed at 0.001 SOL</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="wallet" className="space-y-6">
        <Card className="admin-card">
          <CardHeader>
            <CardTitle>Wallet Settings</CardTitle>
            <CardDescription>
              Configure the presale wallet address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract-address">Contract Address</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="contract-address"
                  className="admin-form-input flex-1"
                  value={localSettings.contract_address}
                  onChange={(e) => handleInputChange('contract_address', e.target.value)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  disabled={isCopied}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {isCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Active Network</Label>
              <div className="flex items-center space-x-4">
                <Badge
                  variant={activeNetwork === 'mainnet' ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => handleNetworkChange('mainnet')}
                >
                  Mainnet
                </Badge>
                <Badge
                  variant={activeNetwork === 'testnet' ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => handleNetworkChange('testnet')}
                >
                  Testnet
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="countdown">
        <CountdownSettings />
      </TabsContent>

      <Button
        onClick={handleSaveSettings}
        disabled={isSaving || !isLoaded}
        className="w-full md:w-auto"
      >
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </Tabs>
  );
};
