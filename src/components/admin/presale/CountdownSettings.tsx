
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PresaleCountdown } from "@/components/presale/PresaleCountdown";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { isValidBlockchainAddress, isValidSolanaAddress, isValidEthereumAddress } from "@/utils/wallet";

export const CountdownSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownDate, setCountdownDate] = useState("");
  const [whitelistedWallets, setWhitelistedWallets] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validatedAddresses, setValidatedAddresses] = useState<{address: string, valid: boolean, type: string}[]>([]);
  
  // Format for HTML date-time input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16); // Format as "YYYY-MM-DDThh:mm"
    } catch (error) {
      console.error("Error formatting date for input:", error);
      return "";
    }
  };
  
  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['show_countdown', 'countdown_date', 'countdown_wallet_overrides']);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          const showCountdownSetting = data.find(item => item.key === 'show_countdown');
          const countdownDateSetting = data.find(item => item.key === 'countdown_date');
          const walletOverridesSetting = data.find(item => item.key === 'countdown_wallet_overrides');
          
          console.log("CountdownSettings: Loading settings - showCountdown:", showCountdownSetting?.value);
          setShowCountdown(showCountdownSetting?.value === 'true');
          
          if (countdownDateSetting?.value) {
            console.log("CountdownSettings: Loading settings - countdownDate:", countdownDateSetting.value);
            setCountdownDate(formatDateForInput(countdownDateSetting.value));
          }
          
          if (walletOverridesSetting?.value) {
            console.log("CountdownSettings: Loading settings - walletOverrides:", walletOverridesSetting.value);
            setWhitelistedWallets(walletOverridesSetting.value);
            validateWallets(walletOverridesSetting.value);
          }
        }
      } catch (error) {
        console.error("Error loading countdown settings:", error);
        toast.error("Failed to load countdown settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Validate wallets when input changes
  const validateWallets = (walletList: string) => {
    const addresses = walletList
      .split('\n')
      .map(address => address.trim())
      .filter(address => address.length > 0);
    
    const errors: string[] = [];
    const validatedAddrs: {address: string, valid: boolean, type: string}[] = [];
    
    addresses.forEach((address, index) => {
      const isSolana = isValidSolanaAddress(address);
      const isEthereum = isValidEthereumAddress(address);
      const isValid = isSolana || isEthereum;
      
      validatedAddrs.push({
        address,
        valid: isValid,
        type: isSolana ? 'Solana' : (isEthereum ? 'Ethereum' : 'Invalid')
      });
      
      if (!isValid) {
        errors.push(`Line ${index + 1}: "${address}" is not a valid blockchain address`);
      }
    });
    
    setValidationErrors(errors);
    setValidatedAddresses(validatedAddrs);
    
    return errors.length === 0;
  };
  
  // Handle wallet input changes
  const handleWalletInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setWhitelistedWallets(value);
    validateWallets(value);
  };
  
  // Save settings to database
  const handleSave = async () => {
    try {
      // Validate all wallet addresses
      if (!validateWallets(whitelistedWallets) && validationErrors.length > 0) {
        toast.error("Please fix the wallet address errors before saving");
        return;
      }
      
      setIsSaving(true);
      
      // Convert input datetime to ISO string
      let isoDateString = "";
      if (countdownDate) {
        const dateObj = new Date(countdownDate);
        isoDateString = dateObj.toISOString();
      }
      
      console.log("CountdownSettings: Saving - showCountdown:", showCountdown);
      console.log("CountdownSettings: Saving - countdownDate:", isoDateString);
      console.log("CountdownSettings: Saving - walletOverrides:", whitelistedWallets);
      
      // Clean up wallet addresses (remove empty lines, trim whitespace)
      const cleanedWallets = whitelistedWallets
        .split('\n')
        .map(address => address.trim())
        .filter(address => address.length > 0)
        .join('\n');
      
      // Prepare updates
      const updates = [
        { key: 'show_countdown', value: showCountdown.toString() },
        { key: 'countdown_date', value: isoDateString },
        { key: 'countdown_wallet_overrides', value: cleanedWallets }
      ];
      
      // Upsert settings - use more detailed approach with individual upsets
      // This approach is more reliable for ensuring all settings get saved
      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(update, { onConflict: 'key' });
        
        if (error) {
          console.error(`Error saving setting ${update.key}:`, error);
          throw new Error(`Failed to save ${update.key}: ${error.message}`);
        }
      }
      
      toast.success("Countdown settings saved successfully");
    } catch (error) {
      console.error("Error saving countdown settings:", error);
      toast.error("Failed to save countdown settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get a human-readable preview of the countdown date
  const getReadableDate = () => {
    if (!countdownDate) return "Not set";
    try {
      return format(new Date(countdownDate), "MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  // Get wallet address summary
  const getWalletSummary = () => {
    if (!whitelistedWallets.trim()) return "No addresses added";
    
    const addresses = whitelistedWallets
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);
    
    const solanaCount = validatedAddresses.filter(a => a.type === 'Solana' && a.valid).length;
    const ethereumCount = validatedAddresses.filter(a => a.type === 'Ethereum' && a.valid).length;
    const invalidCount = validatedAddresses.filter(a => !a.valid).length;
    
    return `${addresses.length} addresses (${solanaCount} Solana, ${ethereumCount} Ethereum${invalidCount > 0 ? `, ${invalidCount} invalid` : ''})`;
  };
  
  return (
    <Card className="admin-card w-full">
      <CardHeader>
        <CardTitle>Presale Countdown Settings</CardTitle>
        <CardDescription>
          Configure the countdown timer that appears before the presale begins
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-center py-4">Loading settings...</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-countdown" className="flex flex-col space-y-1">
                <span>Show Countdown Instead of Presale</span>
                <span className="text-xs text-muted-foreground">
                  When enabled, visitors will see a countdown instead of the presale widget
                </span>
              </Label>
              <Switch
                id="show-countdown"
                checked={showCountdown}
                onCheckedChange={setShowCountdown}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="countdown-date">
                Presale Launch Date & Time
              </Label>
              <Input
                id="countdown-date"
                type="datetime-local"
                value={countdownDate}
                onChange={(e) => setCountdownDate(e.target.value)}
                className="admin-form-input"
              />
              <p className="text-xs text-muted-foreground">
                Preview: {getReadableDate()}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whitelisted-wallets">
                Whitelisted Wallet Addresses
              </Label>
              <Textarea
                id="whitelisted-wallets"
                placeholder="Enter one wallet address per line (Solana or Ethereum)"
                value={whitelistedWallets}
                onChange={handleWalletInputChange}
                className={`admin-form-input min-h-[120px] ${validationErrors.length > 0 ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <div className="text-xs space-y-1">
                <p className="text-muted-foreground">
                  These wallet addresses will see the presale widget even when countdown is enabled. 
                  Enter one address per line. Both Solana and Ethereum addresses are supported.
                </p>
                <p className="text-muted-foreground">
                  Summary: {getWalletSummary()}
                </p>
                
                {validationErrors.length > 0 && (
                  <div className="text-red-500 rounded-md p-2 bg-red-500/10 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      <p className="font-medium">Invalid addresses found:</p>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {validationErrors.slice(0, 3).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {validationErrors.length > 3 && (
                        <li>...and {validationErrors.length - 3} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? "Saving..." : "Save Countdown Settings"}
            </Button>
            
            {showCountdown && countdownDate && (
              <div className="border rounded-lg p-4 mt-4 bg-[#0f1422]">
                <h3 className="text-lg font-semibold mb-4">Preview:</h3>
                <PresaleCountdown targetDate={new Date(countdownDate).toISOString()} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
