
import React, { useState, useEffect } from 'react';
import { useWalletTokens, TokenInfo, tokenToTokenInfo } from '@/hooks/useWalletTokens';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, CheckCircle2, AlertCircle, RefreshCw, Info, ExternalLink, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { logDebug } from '@/utils/debugLogging';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicKey } from '@solana/web3.js';

interface TokenSelectorProps {
  wallet: any;
  activeNetwork: string;
  onTokenSelect: (tokenInfo: TokenInfo) => void;
}

export const TokenSelector = ({ wallet, activeNetwork, onTokenSelect }: TokenSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [manualMintAddress, setManualMintAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(true);

  const getWalletPublicKey = () => {
    if (!wallet) {
      console.log('No wallet provided to TokenSelector');
      return null;
    }
    
    logDebug('TOKEN_SELECTOR', 'Wallet object structure:', wallet);
    
    if (wallet?.publicKey?.toString) {
      logDebug('TOKEN_SELECTOR', 'Found wallet.publicKey.toString()');
      return wallet.publicKey.toString();
    }
    
    if (wallet?.publicKey) {
      logDebug('TOKEN_SELECTOR', 'Found wallet.publicKey directly');
      return wallet.publicKey;
    }
    
    if (window.phantom?.solana?.publicKey) {
      logDebug('TOKEN_SELECTOR', 'Found window.phantom.solana.publicKey');
      return window.phantom.solana.publicKey.toString();
    }
    
    if (window.solflare?.publicKey) {
      logDebug('TOKEN_SELECTOR', 'Found window.solflare.publicKey');
      return window.solflare.publicKey.toString();
    }
    
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      logDebug('TOKEN_SELECTOR', 'Found wallet address in localStorage');
      return storedAddress;
    }
    
    logDebug('TOKEN_SELECTOR', 'No wallet connection found');
    return null;
  };
  
  const walletPublicKey = getWalletPublicKey();
  logDebug('TOKEN_SELECTOR', 'Using wallet public key:', walletPublicKey);
  
  const { tokens, isLoading, error, refetch } = useWalletTokens(walletPublicKey, refreshTrigger);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    logDebug('TOKEN_SELECTOR', `Tokens fetched: ${tokens.length}`, tokens);
  }, [tokens]);

  const handleSelect = (token: TokenInfo) => {
    setSelectedToken(token.mintAddress);
    onTokenSelect(token);
    setOpen(false);
    
    const tokenName = token.metadata?.name || token.metadata?.symbol || 'token';
    toast.success(`Selected ${tokenName}`);
    
    try {
      localStorage.setItem('lastSelectedTokenMint', token.mintAddress);
      localStorage.setItem('lastSelectedTokenName', tokenName);
    } catch (e) {
      // Ignore storage errors
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && walletPublicKey) {
      handleRefresh();
    }
  };

  const handleRefresh = async () => {
    if (!walletPublicKey) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsRefreshing(true);
    try {
      await refetch(true);
      toast.success("Token list refreshed");
    } catch (refreshError) {
      console.error("Error refreshing tokens:", refreshError);
      toast.error("Failed to refresh token list");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualTokenAdd = () => {
    if (!manualMintAddress || manualMintAddress.trim().length < 30) {
      toast.error("Please enter a valid token mint address");
      return;
    }

    try {
      new PublicKey(manualMintAddress);
      
      const tokenInfo: TokenInfo = {
        mintAddress: manualMintAddress,
        amount: 0,
        decimals: 9,
        balance: 0,
        metadata: {
          name: `Token ${manualMintAddress.substring(0, 8)}...`,
          symbol: "TOKEN",
          address: manualMintAddress
        }
      };
      
      handleSelect(tokenInfo);
      toast.success("Custom token added successfully");
      
      setShowManualInput(true);
    } catch (error) {
      console.error("Invalid token address format:", error);
      toast.error("Please enter a valid Solana token address");
    }
  };

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const mintAddressParam = urlParams.get('mintAddress');
      
      if (mintAddressParam && walletPublicKey) {
        setManualMintAddress(mintAddressParam);
        
        const tokenInfo: TokenInfo = {
          mintAddress: mintAddressParam,
          amount: 0,
          decimals: 9,
          balance: 0,
          metadata: {
            name: `Token ${mintAddressParam.substring(0, 8)}...`,
            symbol: "TOKEN",
            address: mintAddressParam
          }
        };
        
        setSelectedToken(mintAddressParam);
        onTokenSelect(tokenInfo);
      }
    } catch (e) {
      // Ignore storage/URL parameter errors
    }
  }, []);

  useEffect(() => {
    if (!walletPublicKey) {
      setSelectedToken(null);
    }
  }, [walletPublicKey]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 w-full md:w-auto"
          disabled={!walletPublicKey}
        >
          <Coins className="h-4 w-4" />
          Select from Wallet
          {!walletPublicKey && (
            <span className="ml-2 text-xs text-muted-foreground">(Connect Wallet First)</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token from Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManualInput(!showManualInput)}
            className="gap-1"
          >
            <Search className="h-4 w-4" />
            {showManualInput ? "Hide Manual Input" : "Enter Token Address"}
          </Button>
        
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={isRefreshing || isLoading}
                  className="gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reload tokens from your wallet</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mb-4 space-y-2">
          <Label htmlFor="manualMintAddress">Token Mint Address</Label>
          <div className="flex gap-2">
            <Input
              id="manualMintAddress"
              value={manualMintAddress}
              onChange={(e) => setManualMintAddress(e.target.value)}
              placeholder="Enter token mint address"
              className="flex-1"
            />
            <Button onClick={handleManualTokenAdd}>Add</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            For tokens not automatically detected in your wallet
          </p>
        </div>
        
        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive font-medium">Error loading tokens</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-2">
              Retry
            </Button>
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Coins className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No tokens found</p>
            <p className="text-sm text-muted-foreground">
              Your wallet doesn't have any token accounts or they all have zero balance.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try using the "Enter Token Address" option to manually add your token.
            </p>
            {activeNetwork === 'testnet' && (
              <div className="mt-4 p-3 bg-amber-100/10 border border-amber-500/20 rounded-md text-amber-300 text-xs max-w-xs">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    For testnet distribution, you'll need to create a token first using the Solana CLI 
                    or a tool like the <a href="https://spl-token-ui.com/" target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1">
                      SPL Token UI <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2">
              {tokens.map((token) => {
                // Convert Token to TokenInfo for consistent handling
                const tokenInfo = tokenToTokenInfo(token);
                return (
                  <div 
                    key={token.mintAddress}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedToken === token.mintAddress 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSelect(tokenInfo)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {token.logo && (
                            <img 
                              src={token.logo} 
                              alt={token.symbol || 'Token'} 
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="font-medium">
                            {token.name || `Token ${token.mintAddress.slice(0, 6)}...`}
                          </span>
                          {token.symbol && (
                            <Badge variant="outline">{token.symbol}</Badge>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground break-all">
                            {token.mintAddress}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(token.mintAddress);
                              toast.success("Token address copied");
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c0 1.1.9 2 2 2h2"/><path d="M4 12c0-1.1.9-2 2-2h2"/><path d="M8 4h8c1.1 0 2 .9 2 2v2"/><path d="M16 4h2c1.1 0 2 .9 2 2v2"/></svg>
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-right">{token.balance?.toLocaleString() || 'N/A'}</span>
                        {selectedToken === token.mintAddress && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter className="flex sm:justify-between">
          <div className="text-xs text-muted-foreground hidden sm:block">
            <span className="font-medium">Network:</span> {activeNetwork === 'mainnet' ? 'Mainnet' : 'Devnet (Testnet)'} 
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
