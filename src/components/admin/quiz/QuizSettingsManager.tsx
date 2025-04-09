
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SubscriptionPrices {
  sol_premium_price: number;
  usdc_premium_price: number;
  usdt_premium_price: number;
}

export const QuizSettingsManager = () => {
  const [settings, setSettings] = useState<SubscriptionPrices>({
    sol_premium_price: 0.1,
    usdc_premium_price: 5,
    usdt_premium_price: 5,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // First try to get from payment_settings
        const { data, error } = await supabase
          .from('payment_settings')
          .select('sol_premium_price, usdc_premium_price, usdt_premium_price')
          .eq('id', 1)
          .single();

        if (error) {
          console.error("Error loading payment settings:", error);
          toast({
            title: "Error",
            description: "Could not load payment settings",
            variant: "destructive",
          });
        } else if (data) {
          setSettings({
            sol_premium_price: data.sol_premium_price || 0.1,
            usdc_premium_price: data.usdc_premium_price || 5,
            usdt_premium_price: data.usdt_premium_price || 5,
          });
        }
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleInputChange = (field: keyof SubscriptionPrices, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setSettings((prev) => ({
        ...prev,
        [field]: numericValue,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Update payment_settings table
      const { error } = await supabase
        .from('payment_settings')
        .update({
          sol_premium_price: settings.sol_premium_price,
          usdc_premium_price: settings.usdc_premium_price,
          usdt_premium_price: settings.usdt_premium_price,
        })
        .eq('id', 1);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Quiz subscription prices updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Subscription Pricing</CardTitle>
        <CardDescription>
          Set the prices for premium access to the quiz system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="sol_price">SOL Price</Label>
              <div className="flex items-center mt-1">
                <Input
                  id="sol_price"
                  type="number"
                  step="0.001"
                  min="0"
                  value={settings.sol_premium_price}
                  onChange={(e) => handleInputChange("sol_premium_price", e.target.value)}
                  className="flex-1"
                />
                <span className="ml-2 font-medium text-sm">SOL</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="usdc_price">USDC Price</Label>
              <div className="flex items-center mt-1">
                <Input
                  id="usdc_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.usdc_premium_price}
                  onChange={(e) => handleInputChange("usdc_premium_price", e.target.value)}
                  className="flex-1"
                />
                <span className="ml-2 font-medium text-sm">USDC</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="usdt_price">USDT Price</Label>
              <div className="flex items-center mt-1">
                <Input
                  id="usdt_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.usdt_premium_price}
                  onChange={(e) => handleInputChange("usdt_premium_price", e.target.value)}
                  className="flex-1"
                />
                <span className="ml-2 font-medium text-sm">USDT</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Prices
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
