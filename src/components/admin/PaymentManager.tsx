import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface PaymentSettings {
  sol_address: string;
  sol_premium_price: number;
  eth_address: string;
  eth_premium_price: number;
  test_eth_address: string;
  usdc_address?: string;
  usdt_address?: string;
  usdc_premium_price?: number;
  usdt_premium_price?: number;
}

export const PaymentManager = () => {
  const [settings, setSettings] = useState<PaymentSettings>({
    sol_address: '',
    sol_premium_price: 0.1,
    eth_address: '',
    eth_premium_price: 0.01,
    test_eth_address: '',
    usdc_address: '',
    usdt_address: '',
    usdc_premium_price: 5,
    usdt_premium_price: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingSecrets, setIsUpdatingSecrets] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      setIsLoading(true);
      console.log("Loading payment settings...");
      
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('Error loading payment settings:', error);
        throw error;
      }
      
      console.log("Payment settings loaded:", data);
      
      if (data) {
        setSettings({
          ...data,
          sol_address: data.sol_address || '',
          eth_address: data.eth_address || '',
          test_eth_address: data.test_eth_address || '',
          usdc_address: data.usdc_address || '',
          usdt_address: data.usdt_address || '',
          usdc_premium_price: data.usdc_premium_price || 5,
          usdt_premium_price: data.usdt_premium_price || 5
        });
      } else {
        console.log("No payment settings found with ID=1, creating defaults");
        await createInitialSettings();
        await reloadSettings();
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to load payment settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createInitialSettings = async () => {
    try {
      console.log("Creating initial payment settings with ID=1...");
      
      const { error } = await supabase
        .from('payment_settings')
        .insert({
          id: 1,
          sol_address: '',
          sol_premium_price: 0.1,
          eth_address: '',
          eth_premium_price: 0.01,
          test_eth_address: '',
          usdc_address: '',
          usdt_address: '',
          usdc_premium_price: 5,
          usdt_premium_price: 5,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error creating initial settings:", error);
        throw error;
      }
      
      console.log("Initial payment settings created with ID=1");
    } catch (error) {
      console.error("Error creating initial settings:", error);
    }
  };

  const reloadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
        
      if (error) throw error;
      if (data) {
        setSettings({
          ...data,
          sol_address: data.sol_address || '',
          eth_address: data.eth_address || '',
          test_eth_address: data.test_eth_address || '',
          usdc_address: data.usdc_address || '',
          usdt_address: data.usdt_address || '',
          usdc_premium_price: data.usdc_premium_price || 5,
          usdt_premium_price: data.usdt_premium_price || 5
        });
      }
    } catch (error) {
      console.error("Error reloading settings:", error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      console.log("Saving payment settings:", settings);
      
      if (settings.sol_address && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(settings.sol_address)) {
        throw new Error('Invalid Solana address format');
      }

      if (settings.eth_address && !/^0x[a-fA-F0-9]{40}$/.test(settings.eth_address)) {
        throw new Error('Invalid Ethereum address format');
      }
      
      if (settings.test_eth_address && !/^0x[a-fA-F0-9]{40}$/.test(settings.test_eth_address)) {
        throw new Error('Invalid Ethereum testnet address format');
      }

      if (settings.usdc_address && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(settings.usdc_address)) {
        throw new Error('Invalid USDC address format');
      }

      if (settings.usdt_address && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(settings.usdt_address)) {
        throw new Error('Invalid USDT address format');
      }

      if (settings.sol_premium_price <= 0) throw new Error('SOL price must be greater than 0');
      if (settings.eth_premium_price <= 0) throw new Error('ETH price must be greater than 0');
      if (settings.usdc_premium_price && settings.usdc_premium_price <= 0) throw new Error('USDC price must be greater than 0');
      if (settings.usdt_premium_price && settings.usdt_premium_price <= 0) throw new Error('USDT price must be greater than 0');

      console.log("Saving to payment_settings with id=1:");
      console.log("SOL address:", settings.sol_address || '');
      console.log("ETH address:", settings.eth_address || '');
      console.log("Test ETH address:", settings.test_eth_address || '');
      console.log("USDC address:", settings.usdc_address || '');
      console.log("USDT address:", settings.usdt_address || '');
      console.log("USDC price:", settings.usdc_premium_price || 5);
      console.log("USDT price:", settings.usdt_premium_price || 5);
      
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          id: 1,
          sol_address: settings.sol_address || '',
          sol_premium_price: settings.sol_premium_price,
          eth_address: settings.eth_address || '',
          eth_premium_price: settings.eth_premium_price,
          test_eth_address: settings.test_eth_address || '',
          usdc_address: settings.usdc_address || '',
          usdt_address: settings.usdt_address || '',
          usdc_premium_price: settings.usdc_premium_price || 5,
          usdt_premium_price: settings.usdt_premium_price || 5,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error("Error saving payment settings:", error);
        throw error;
      }

      console.log("Payment settings saved successfully with ID=1");
      
      toast({
        title: "Success",
        description: "Payment settings updated successfully",
      });
      
      await updateEdgeFunctionSecrets();
      
      await loadPaymentSettings();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update payment settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateEdgeFunctionSecrets = async () => {
    try {
      setIsUpdatingSecrets(true);
      
      if (settings.usdc_address || settings.usdt_address) {
        console.log("Calling update-payment-secrets function");
        
        const { data, error } = await supabase.functions.invoke('update-payment-secrets', {
          body: {
            addresses: {
              usdc_address: settings.usdc_address,
              usdt_address: settings.usdt_address
            }
          }
        });
        
        if (error) {
          console.error("Error calling update-payment-secrets function:", error);
          throw error;
        }
        
        console.log("Update secrets response:", data);
        
        if (data && data.success) {
          toast({
            title: "Edge Function Secrets",
            description: "Please check Edge Function logs and update the secrets in Supabase dashboard",
          });
        } else {
          throw new Error(data?.error || "Unknown error updating secrets");
        }
      }
    } catch (error: any) {
      console.error("Error updating edge function secrets:", error);
      toast({
        title: "Important",
        description: "Please manually update token receiver addresses in Edge Function secrets",
      });
    } finally {
      setIsUpdatingSecrets(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Settings</CardTitle>
        <CardDescription>
          Configure cryptocurrency wallet addresses and premium access pricing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Solana Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="sol_address">Solana Wallet Address</Label>
              <Input
                id="sol_address"
                placeholder="Enter Solana wallet address"
                value={settings.sol_address}
                onChange={(e) => setSettings(prev => ({ ...prev, sol_address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sol_premium_price">SOL Premium Price</Label>
              <Input
                id="sol_premium_price"
                type="number"
                step="0.01"
                min="0"
                value={settings.sol_premium_price}
                onChange={(e) => setSettings(prev => ({ ...prev, sol_premium_price: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="usdc_address">USDC Receiver Address (optional)</Label>
              <Input
                id="usdc_address"
                placeholder="Enter USDC receiver address (defaults to SOL address if empty)"
                value={settings.usdc_address}
                onChange={(e) => setSettings(prev => ({ ...prev, usdc_address: e.target.value }))}
              />
              {settings.usdc_address && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(settings.usdc_address) && (
                <p className="text-xs text-red-500">
                  Invalid Solana address format
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                If left empty, the main Solana address will be used for USDC payments
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usdc_premium_price">USDC Premium Price</Label>
              <Input
                id="usdc_premium_price"
                type="number"
                step="0.01"
                min="0"
                value={settings.usdc_premium_price}
                onChange={(e) => setSettings(prev => ({ ...prev, usdc_premium_price: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usdt_address">USDT Receiver Address (optional)</Label>
              <Input
                id="usdt_address"
                placeholder="Enter USDT receiver address (defaults to SOL address if empty)"
                value={settings.usdt_address}
                onChange={(e) => setSettings(prev => ({ ...prev, usdt_address: e.target.value }))}
              />
              {settings.usdt_address && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(settings.usdt_address) && (
                <p className="text-xs text-red-500">
                  Invalid Solana address format
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                If left empty, the main Solana address will be used for USDT payments
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usdt_premium_price">USDT Premium Price</Label>
              <Input
                id="usdt_premium_price"
                type="number"
                step="0.01"
                min="0"
                value={settings.usdt_premium_price}
                onChange={(e) => setSettings(prev => ({ ...prev, usdt_premium_price: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ethereum Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="eth_address">Ethereum Wallet Address (Mainnet)</Label>
              <Input
                id="eth_address"
                placeholder="Enter Ethereum wallet address (0x...)"
                value={settings.eth_address}
                onChange={(e) => setSettings(prev => ({ ...prev, eth_address: e.target.value }))}
              />
              {settings.eth_address && !/^0x[a-fA-F0-9]{40}$/.test(settings.eth_address) && (
                <p className="text-xs text-red-500">
                  Invalid Ethereum address format. Must start with 0x followed by 40 hexadecimal characters.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="test_eth_address">Ethereum Wallet Address (Testnet)</Label>
              <Input
                id="test_eth_address"
                placeholder="Enter Ethereum testnet wallet address (0x...)"
                value={settings.test_eth_address}
                onChange={(e) => setSettings(prev => ({ ...prev, test_eth_address: e.target.value }))}
              />
              {settings.test_eth_address && !/^0x[a-fA-F0-9]{40}$/.test(settings.test_eth_address) && (
                <p className="text-xs text-red-500">
                  Invalid Ethereum address format. Must start with 0x followed by 40 hexadecimal characters.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Used for test transactions on Sepolia/other testnets. If empty, mainnet address will be used.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eth_premium_price">ETH Premium Price</Label>
              <Input
                id="eth_premium_price"
                type="number"
                step="0.001"
                min="0"
                value={settings.eth_premium_price}
                onChange={(e) => setSettings(prev => ({ ...prev, eth_premium_price: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isLoading || isUpdatingSecrets}
          className="w-full"
        >
          {isLoading ? "Saving..." : isUpdatingSecrets ? "Updating Secrets..." : "Save Changes"}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          After saving, you'll need to manually update the USDC_RECEIVER_ADDRESS and USDT_RECEIVER_ADDRESS secrets in the Supabase Dashboard.
        </p>
      </CardContent>
    </Card>
  );
};
