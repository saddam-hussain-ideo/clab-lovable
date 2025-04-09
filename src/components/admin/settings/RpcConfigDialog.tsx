
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Settings2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setCustomRpcUrl, setAlchemyApiKey, getCustomRpcUrl } from '@/utils/rpc/rpcUtils';
import { getBlockchainNetwork } from '@/utils/wallet';
import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';

export function RpcConfigDialog() {
  const [open, setOpen] = useState(false);
  const [customRpcUrl, setCustomRpcUrlState] = useState('');
  const [alchemyApiKey, setAlchemyApiKeyState] = useState('');
  const [activeTab, setActiveTab] = useState('alchemy');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'idle' | 'warning';
    message: string;
  }>({ type: 'idle', message: '' });
  const [currentSettings, setCurrentSettings] = useState<{
    hasCustomRpc: boolean;
    hasAlchemyKey: boolean;
  }>({ hasCustomRpc: false, hasAlchemyKey: false });

  useEffect(() => {
    // Load current settings when dialog opens
    if (open) {
      loadCurrentSettings();
    }
  }, [open]);

  const loadCurrentSettings = () => {
    try {
      const network = getBlockchainNetwork();
      const customRpc = localStorage.getItem('customSolanaRpcUrl');
      const alchemyKey = localStorage.getItem('alchemyApiKey');

      console.log(`🔄 Loading RPC settings - Custom RPC: ${customRpc ? 'Found' : 'Not found'}, Alchemy: ${alchemyKey ? 'Found' : 'Not found'}`);
      
      setCurrentSettings({
        hasCustomRpc: !!customRpc && customRpc.startsWith('http'),
        hasAlchemyKey: !!alchemyKey,
      });

      // Set the form values if they exist
      if (customRpc && customRpc.startsWith('http')) {
        setCustomRpcUrlState(customRpc);
      } else {
        setCustomRpcUrlState('');
      }
      
      if (alchemyKey) {
        setAlchemyApiKeyState(alchemyKey);
      } else {
        setAlchemyApiKeyState('');
      }

      // Set active tab based on what's configured
      if (alchemyKey) {
        setActiveTab('alchemy');
      } else if (customRpc && customRpc.startsWith('http')) {
        setActiveTab('custom');
      } else {
        // Default to Alchemy tab when nothing is configured
        setActiveTab('alchemy');
      }

      // Log the settings we found
      console.log(`📊 Current RPC settings - Custom RPC: ${!!customRpc}, Alchemy: ${!!alchemyKey}`);
      logDebug('RPC_CONFIG', `Dialog opened - Current settings loaded - Custom RPC: ${!!customRpc}, Alchemy: ${!!alchemyKey}`);
      
    } catch (error) {
      console.error("Error loading current settings:", error);
      setStatus({
        type: 'error',
        message: 'Failed to load current settings',
      });
    }
  };

  const verifySettings = () => {
    try {
      const network = getBlockchainNetwork();
      const rpcUrl = getCustomRpcUrl(network);
      
      if (rpcUrl) {
        console.log(`✅ VERIFICATION: Custom RPC is configured: ${rpcUrl.substring(0, 30)}...`);
        setStatus({
          type: 'success',
          message: `RPC settings verified! Using ${rpcUrl.includes('alchemy') ? 'Alchemy' : 'custom'} endpoint`,
        });
        return true;
      } else {
        console.log('⚠️ VERIFICATION: No custom RPC is configured');
        setStatus({
          type: 'warning',
          message: 'No custom RPC configured, will use public endpoints',
        });
        return false;
      }
    } catch (error) {
      console.error("Error verifying settings:", error);
      setStatus({
        type: 'error',
        message: 'Failed to verify RPC settings',
      });
      return false;
    }
  };

  const handleSaveAlchemy = () => {
    try {
      if (!alchemyApiKey.trim()) {
        setStatus({
          type: 'error',
          message: 'Please enter a valid Alchemy API key',
        });
        return;
      }

      // Clear any existing custom RPC URL when saving Alchemy key
      if (localStorage.getItem('customSolanaRpcUrl')) {
        localStorage.removeItem('customSolanaRpcUrl');
        console.log('Removed existing custom RPC URL in favor of Alchemy API key');
      }

      setCustomRpcUrl(''); // Clear custom RPC URL state
      setAlchemyApiKey(alchemyApiKey);
      setStatus({
        type: 'success',
        message: 'Alchemy API key saved successfully',
      });
      
      console.log(`✅ SAVED: Alchemy API key set to ${alchemyApiKey.substring(0, 6)}...`);
      toast.success("Alchemy API key saved successfully");
      
      // Force a reload of settings
      loadCurrentSettings();
      
      // Verify settings were saved
      setTimeout(() => {
        const verified = verifySettings();
        
        // Close dialog after verification
        if (verified) {
          setTimeout(() => {
            // Refresh page to ensure new RPC settings are used
            if (confirm('RPC settings saved. Refresh page to apply new settings?')) {
              window.location.reload();
            } else {
              setOpen(false);
            }
          }, 1500);
        }
      }, 500);
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to save Alchemy API key',
      });
      toast.error("Failed to save Alchemy API key");
    }
  };

  const handleSaveCustomRpc = () => {
    try {
      if (!customRpcUrl.trim() || !customRpcUrl.startsWith('http')) {
        setStatus({
          type: 'error',
          message: 'Please enter a valid RPC URL starting with http(s)://',
        });
        return;
      }

      // Clear any existing Alchemy API key when saving custom RPC URL
      if (localStorage.getItem('alchemyApiKey')) {
        localStorage.removeItem('alchemyApiKey');
        console.log('Removed existing Alchemy API key in favor of custom RPC URL');
      }

      setAlchemyApiKeyState(''); // Clear Alchemy API key state
      setCustomRpcUrl(customRpcUrl);
      setStatus({
        type: 'success',
        message: 'Custom RPC URL saved successfully',
      });
      
      console.log(`✅ SAVED: Custom RPC URL set to ${customRpcUrl.substring(0, 20)}...`);
      toast.success("Custom RPC URL saved successfully");
      
      // Force a reload of settings
      loadCurrentSettings();
      
      // Verify settings were saved
      setTimeout(() => {
        const verified = verifySettings();
        
        // Close dialog after verification
        if (verified) {
          setTimeout(() => {
            // Refresh page to ensure new RPC settings are used
            if (confirm('RPC settings saved. Refresh page to apply new settings?')) {
              window.location.reload();
            } else {
              setOpen(false);
            }
          }, 1500);
        }
      }, 500);
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to save custom RPC URL',
      });
      toast.error("Failed to save custom RPC URL");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when dialog closes
      setStatus({ type: 'idle', message: '' });
    } else {
      // Load settings when dialog opens
      loadCurrentSettings();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configure RPC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Solana RPC Access</DialogTitle>
        </DialogHeader>

        {currentSettings.hasCustomRpc || currentSettings.hasAlchemyKey ? (
          <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-900">
            <div className="flex items-center text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span>
                {currentSettings.hasAlchemyKey 
                  ? 'Using Alchemy RPC' 
                  : 'Using custom RPC URL'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-900">
            <div className="flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
              <span>No custom RPC configured. Using public endpoints.</span>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alchemy">Alchemy</TabsTrigger>
            <TabsTrigger value="custom">Custom RPC</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alchemy" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alchemy-api-key">Alchemy API Key</Label>
              <Input
                id="alchemy-api-key"
                value={alchemyApiKey}
                onChange={(e) => setAlchemyApiKeyState(e.target.value)}
                placeholder="Enter your Alchemy API key"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://www.alchemy.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Alchemy
                </a>
              </p>
            </div>

            {status.type !== 'idle' && (
              <Alert variant={status.type === 'error' ? 'destructive' : status.type === 'warning' ? 'default' : 'default'}>
                {status.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : status.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSaveAlchemy}
              className="w-full"
              disabled={status.type === 'success'}
            >
              Save Alchemy API Key
            </Button>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-rpc-url">Custom RPC URL</Label>
              <Input
                id="custom-rpc-url"
                value={customRpcUrl}
                onChange={(e) => setCustomRpcUrlState(e.target.value)}
                placeholder="https://your-rpc-endpoint.com"
              />
              <p className="text-xs text-muted-foreground">
                Enter a complete RPC URL including https://
              </p>
            </div>

            {status.type !== 'idle' && (
              <Alert variant={status.type === 'error' ? 'destructive' : status.type === 'warning' ? 'default' : 'default'}>
                {status.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : status.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSaveCustomRpc}
              className="w-full"
              disabled={status.type === 'success'}
            >
              Save Custom RPC URL
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={verifySettings}>
            Verify Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
