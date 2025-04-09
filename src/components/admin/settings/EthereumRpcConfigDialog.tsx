
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Settings2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Simple RPC configuration dialog similar to the Solana one
export function EthereumRpcConfigDialog() {
  const [open, setOpen] = useState(false);
  const [alchemyApiKey, setAlchemyApiKey] = useState('');
  const [customRpcUrl, setCustomRpcUrl] = useState('');
  const [activeTab, setActiveTab] = useState<string>('alchemy');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'idle' | 'warning';
    message: string;
  }>({ type: 'idle', message: '' });
  const [currentSettings, setCurrentSettings] = useState<{
    hasCustomRpc: boolean;
    hasAlchemyKey: boolean;
  }>({ hasCustomRpc: false, hasAlchemyKey: false });

  useEffect(() => {
    if (open) {
      loadCurrentSettings();
    }
  }, [open]);

  const loadCurrentSettings = () => {
    try {
      const alchemyKey = localStorage.getItem('ethereumAlchemyApiKey');
      const customRpc = localStorage.getItem('customEthereumRpcUrl');
      
      setCurrentSettings({
        hasCustomRpc: !!customRpc,
        hasAlchemyKey: !!alchemyKey,
      });
      
      if (alchemyKey) {
        setAlchemyApiKey(alchemyKey);
        setActiveTab('alchemy');
      } else if (customRpc) {
        setCustomRpcUrl(customRpc);
        setActiveTab('custom');
      } else {
        setActiveTab('alchemy');
      }
    } catch (error) {
      console.error("Error loading current settings:", error);
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

      localStorage.setItem('ethereumAlchemyApiKey', alchemyApiKey);
      setStatus({
        type: 'success',
        message: 'Alchemy API key saved successfully',
      });
      
      toast.success("Alchemy API key saved successfully");
      setTimeout(() => setOpen(false), 1500);
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

      localStorage.setItem('customEthereumRpcUrl', customRpcUrl);
      setStatus({
        type: 'success',
        message: 'Custom RPC URL saved successfully',
      });
      
      toast.success("Custom RPC URL saved successfully");
      setTimeout(() => setOpen(false), 1500);
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to save custom RPC URL',
      });
      toast.error("Failed to save custom RPC URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configure RPC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Ethereum RPC Access</DialogTitle>
        </DialogHeader>

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
                onChange={(e) => setAlchemyApiKey(e.target.value)}
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
                onChange={(e) => setCustomRpcUrl(e.target.value)}
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
      </DialogContent>
    </Dialog>
  );
}
