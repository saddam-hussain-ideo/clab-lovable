import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useState, useEffect, FC, useCallback, useRef } from "react";
import { Loader2, Wallet, RefreshCw, AlertCircle } from "lucide-react";
import { WalletType } from "@/services/wallet/walletService";
import { setExplicitDisconnectFlag, clearWalletState, requestWalletRecheck } from "@/utils/wallet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { logDebug } from "@/utils/debugLogging";
import { useWalletConnectionStatus } from "@/hooks/useWalletConnectionStatus";
import { useWalletContext } from "@/providers/WalletProvider";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { formatWalletAddress } from "@/utils/wallet/formatWalletAddress";
import { useAppKit } from "@reown/appkit/react";

interface WalletButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "nav";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onConnectChange?: (connected: boolean, address?: string | null, walletType?: WalletType | null) => void;
  useModal?: boolean;
  solanaOnly?: boolean;
  fastInitialization?: boolean;
  network?: 'mainnet' | 'testnet';
  isConnected?: boolean;
  alwaysBuyButton?: boolean;
  paymentCurrency?: string;
  disabled?: boolean;
  onAmountChange?: (amount: number) => void;
  expectedTokenAmount?: number;
  isConnecting?: boolean;
  walletAddress?: string | null;
  walletType?: WalletType | null;
}

export const WalletButton: FC<WalletButtonProps> = ({ 
  variant = "outline", 
  size = "default",
  className,
  onConnectChange,
  useModal = false,
  solanaOnly = false,
  fastInitialization = false,
  network,
  isConnected = false,
  alwaysBuyButton = false,
  paymentCurrency,
  disabled = false,
  onAmountChange,
  expectedTokenAmount,
  isConnecting: externalIsConnecting,
  walletAddress: externalWalletAddress,
  walletType: externalWalletType
}) => {
  // Use the new Wagmi wallet hook
  const {
    address: wagmiAddress,
    isConnected: wagmiIsConnected,
    isConnecting: wagmiIsConnecting,
    disconnectWallet,
    connectWallet
  } = useWalletConnect();
  
  // Access Reown modal
  const { open: openReownModal } = useAppKit();
  
  // Keep the existing hooks for backward compatibility
  const { 
    isConnected: walletIsConnected, 
    walletAddress: hookWalletAddress,
    walletType: hookWalletType,
    connectWallet: oldConnectWallet,
    disconnectWallet: disconnect,
    isConnecting: walletIsConnecting,
    checkStoredWallet
  } = useWallet();
  
  const {
    isConnected: globalWalletConnected,
    walletAddress: globalWalletAddress,
    walletType: globalWalletType,
    verifyConnection,
    requestRecheck
  } = useWalletConnectionStatus();
  
  const {
    isConnected: contextIsConnected,
    walletAddress: contextWalletAddress,
    walletType: contextWalletType,
    updateWalletState
  } = useWalletContext();
  
  const [isWalletConnected, setIsWalletConnected] = useState(
    wagmiIsConnected || isConnected || walletIsConnected || globalWalletConnected || contextIsConnected
  );
  const [isConnecting, setIsConnecting] = useState(
    wagmiIsConnecting || (externalIsConnecting !== undefined ? externalIsConnecting : walletIsConnecting)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);
  const isMounted = useRef(true);
  const lastKnownAddress = useRef<string | null>(null);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Prioritize the Wagmi address
  const walletAddress = wagmiAddress || contextWalletAddress || globalWalletAddress || hookWalletAddress || externalWalletAddress || localStorage.getItem('walletAddress');
  const walletType = contextWalletType || globalWalletType || hookWalletType || externalWalletType || localStorage.getItem('walletType') as WalletType | null;
  
  const currentDisplayAddress = walletAddress ? formatWalletAddress(walletAddress) : "Connect";
  
  // Handle wallet connection
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Use Reown modal directly
      openReownModal();
      
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      // First try to disconnect using Wagmi
      if (wagmiIsConnected) {
        await disconnectWallet();
      }
      
      // Then use the old disconnect method for backward compatibility
      await disconnect();
      
      // Clear local storage
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      
      // Update state
      setIsWalletConnected(false);
      
      // Set explicit disconnect flag
      setExplicitDisconnectFlag(true);
      
      // Clear wallet state
      clearWalletState();
      
      // Notify parent component
      if (onConnectChange) {
        onConnectChange(false, null, null);
      }
      
      // Update context
      if (updateWalletState) {
        updateWalletState(false, null, null);
      }
      
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  // Update the connection state when the address changes
  useEffect(() => {
    if (wagmiAddress && wagmiIsConnected) {
      setIsWalletConnected(true);
      lastKnownAddress.current = wagmiAddress;
      
      // Update the wallet context
      updateWalletState(true, wagmiAddress, 'metamask');
      
      // Notify parent component if callback provided
      if (onConnectChange) {
        onConnectChange(true, wagmiAddress, 'metamask');
      }
    }
  }, [wagmiAddress, wagmiIsConnected, updateWalletState, onConnectChange]);

  // Check for wallet connection on mount and when Wagmi state changes
  useEffect(() => {
    if (wagmiIsConnected && wagmiAddress) {
      setIsWalletConnected(true);
      
      // Determine wallet type based on address format
      const detectedType = wagmiAddress.startsWith('0x') ? 'metamask' : 'phantom';
      
      // Store in local storage
      localStorage.setItem('walletAddress', wagmiAddress);
      localStorage.setItem('walletType', detectedType);
      
      // Update context if available
      if (updateWalletState) {
        updateWalletState(true, wagmiAddress, detectedType as WalletType);
      }
      
      // Notify parent component
      if (onConnectChange) {
        onConnectChange(true, wagmiAddress, detectedType as WalletType);
      }
      
      // Update last known address
      lastKnownAddress.current = wagmiAddress;
    } else if (!wagmiIsConnected && !wagmiIsConnecting) {
      // Only update if we're not in the process of connecting
      // and if we previously had a connection
      if (lastKnownAddress.current) {
        setIsWalletConnected(false);
        
        // Update context if available
        if (updateWalletState) {
          updateWalletState(false, null, null);
        }
        
        // Notify parent component
        if (onConnectChange) {
          onConnectChange(false, null, null);
        }
        
        // Clear last known address
        lastKnownAddress.current = null;
      }
    }
  }, [wagmiIsConnected, wagmiAddress, wagmiIsConnecting, updateWalletState, onConnectChange]);

  // Check for wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (fastInitialization) {
          // Fast path: just check local storage
          const storedAddress = localStorage.getItem('walletAddress');
          const storedType = localStorage.getItem('walletType') as WalletType;
          
          if (storedAddress && storedType) {
            setIsWalletConnected(true);
            lastKnownAddress.current = storedAddress;
          }
        } else {
          // Thorough check
          const result = await checkStoredWallet();
          if (result && result.address) {
            setIsWalletConnected(true);
            lastKnownAddress.current = result.address;
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };
    
    checkConnection();
  }, [checkStoredWallet, fastInitialization]);

  // Handle wallet connection from modal
  const handleWalletConnected = useCallback((connected: boolean, address: string | null, type?: WalletType | null) => {
    if (connected && address) {
      setIsWalletConnected(true);
      lastKnownAddress.current = address;
      
      // Update wallet context
      updateWalletState(true, address, type || null);
      
      // Notify parent component if callback provided
      if (onConnectChange) {
        onConnectChange(true, address, type || null);
      }
    }
  }, [onConnectChange, updateWalletState]);

  // Handle wallet refresh
  const handleRefreshWallet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      
      // Request a recheck of the wallet connection
      requestWalletRecheck();
      requestRecheck();
      
      // Check if we have a wallet address
      if (walletAddress) {
        // Verify the connection
        const isValid = await verifyConnection();
        
        if (isValid) {
          setHasConnectionIssue(false);
          toast.success("Wallet connection verified");
        } else {
          setHasConnectionIssue(true);
          toast.error("Wallet connection issue detected");
        }
      } else if (isWalletConnected) {
        // We think we're connected but don't have an address
        setHasConnectionIssue(true);
        toast.error("Wallet connection issue detected");
      } else {
        // We're not connected, so no issue
        setHasConnectionIssue(false);
      }
    } catch (error) {
      console.error("Error refreshing wallet:", error);
      toast.error("Failed to refresh wallet connection");
      setHasConnectionIssue(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle fixing connection issues
  const handleFixConnection = async () => {
    try {
      setIsRefreshing(true);
      
      // Disconnect first
      await disconnectWallet();
      await disconnect();
      
      // Clear wallet state
      clearWalletState();
      
      // Update local state
      setIsWalletConnected(false);
      setHasConnectionIssue(false);
      lastKnownAddress.current = null;
      
      // Update wallet context
      updateWalletState(false, null, null);
      
      // Notify parent component if callback provided
      if (onConnectChange) {
        onConnectChange(false, null, null);
      }
      
      toast.success("Wallet connection reset. Please connect again.");
      
      // Open the wallet modal to reconnect
      if (useModal) {
        openReownModal();
      }
    } catch (error) {
      console.error("Error fixing connection:", error);
      toast.error("Failed to fix wallet connection");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (hasConnectionIssue && isWalletConnected && walletAddress) {
    return (
      <div className="flex items-center">
        <Button
          variant="destructive"
          size={size}
          className={cn("font-medium", className, "bg-red-900 hover:bg-red-800 text-white")}
          onClick={handleFixConnection}
          disabled={!!isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing Connection...
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Fix Wallet Connection
            </>
          )}
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 ml-1"
                onClick={handleRefreshWallet}
                disabled={isRefreshing}
              >
                <RefreshCw 
                  className={cn(
                    "h-4 w-4 text-muted-foreground", 
                    isRefreshing ? "animate-spin text-primary" : ""
                  )} 
                />
                <span className="sr-only">Refresh wallet connection</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh wallet connection state</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 mr-1"
              onClick={handleRefreshWallet}
              disabled={isRefreshing}
            >
              <RefreshCw 
                className={cn(
                  "h-4 w-4 text-muted-foreground", 
                  isRefreshing ? "animate-spin text-primary" : ""
                )} 
              />
              <span className="sr-only">Refresh wallet connection</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh wallet connection state</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isWalletConnected ? (
        <Button
          variant={variant}
          size={size}
          onClick={handleDisconnect}
          className={cn("font-medium", className)}
          title="Disconnect wallet"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4 text-purple-400" />
              <span className="flex items-center">
                <span className="bg-gradient-to-r from-purple-400 to-sky-500 bg-clip-text text-transparent font-medium">
                  {currentDisplayAddress}
                </span>
              </span>
            </>
          )}
        </Button>
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={handleConnect}
          className={cn("font-medium", className)}
          disabled={isConnecting || !!disabled}
          title="Connect wallet"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
      )}
    </div>
  );
};
