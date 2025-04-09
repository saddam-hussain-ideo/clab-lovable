import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";
import { TotalPurchasesDisplay } from "./TotalPurchasesDisplay";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { fetchAllWalletPurchases, PurchaseData, isEthereumAddress } from "@/services/purchasesService";
import { setActiveNetwork, getActiveNetwork } from '@/utils/wallet';
import { getNetworkPreference } from '@/utils/presale/purchaseHandlers'; 
import { formatWalletAddress } from '@/utils/wallet/formatWalletAddress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PresalePurchasesProps {
  profile: Profile | null;
}

export const PresalePurchases = ({
  profile
}: PresalePurchasesProps) => {
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingTransactions, setUpdatingTransactions] = useState(false);
  const [activeNetwork, setActiveNetworkState] = useState<'mainnet' | 'testnet'>('mainnet'); // Default to mainnet
  const [showNetworkToggle, setShowNetworkToggle] = useState(false);
  const [consolidatedView, setConsolidatedView] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(profile?.wallet_address || null);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const itemsPerPage = 10;
  
  useEffect(() => {
    setCurrentWalletAddress(profile?.wallet_address || null);
  }, [profile?.wallet_address]);
  
  useEffect(() => {
    const fetchNetworkPreferences = async () => {
      try {
        const { show_network_toggle, active_network } = await getNetworkPreference();
        
        setShowNetworkToggle(true);
        
        if (isAdmin) {
          const storedPreference = localStorage.getItem('userNetworkPreference');
          if (storedPreference === 'testnet' || storedPreference === 'mainnet') {
            setActiveNetworkState(storedPreference);
          } else {
            setActiveNetworkState(active_network);
            localStorage.setItem('userNetworkPreference', active_network);
          }
        } else {
          setActiveNetworkState(active_network);
        }
      } catch (error) {
        console.error("Error fetching network preferences:", error);
        setActiveNetworkState('mainnet');
      }
    };
    
    fetchNetworkPreferences();
  }, [isAdmin]);
  
  const fetchPurchases = async (forceRefresh = false) => {
    const walletAddress = currentWalletAddress;
    
    if (!walletAddress) {
      setPurchases([]);
      setTotalPurchases(0);
      setLoading(false);
      return;
    }
    
    try {
      const walletType = profile?.wallet_type || localStorage.getItem('walletType');
      
      if (forceRefresh || loading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const normalizedWalletAddress = walletAddress.toLowerCase();
      const isEthereum = isEthereumAddress(normalizedWalletAddress);
      
      let effectiveWalletType = walletType;
      if (isEthereum) {
        effectiveWalletType = null;
      }

      console.log(`Fetching purchases for ${normalizedWalletAddress} with type ${effectiveWalletType || 'all'} on ${consolidatedView ? 'both networks' : activeNetwork}`);

      const { data, totalCount } = await fetchAllWalletPurchases(
        normalizedWalletAddress,
        effectiveWalletType,
        currentPage,
        itemsPerPage,
        activeNetwork,
        consolidatedView
      );
      
      setPurchases(data);
      setTotalPurchases(totalCount);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load your purchases");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const refreshPurchases = () => {
    setCurrentPage(1);
    fetchPurchases(true);
    toast.info("Refreshing purchase data...");
  };
  
  const updatePendingTransactions = async () => {
    if (!currentWalletAddress) return;
    
    setUpdatingTransactions(true);
    try {
      toast.info("Checking for pending transactions...");
      const { data, error } = await supabase.functions.invoke('trigger-contribution-updates', {
        body: {
          network: consolidatedView ? 'all' : activeNetwork,
          walletAddress: currentWalletAddress
        }
      });
      if (error) throw error;
      const updatedCount = data?.result?.updated || 0;
      if (updatedCount > 0) {
        toast.success(`Updated ${updatedCount} transaction${updatedCount !== 1 ? 's' : ''}`);
        fetchPurchases(true);
      } else {
        toast.info("No transactions needed updating");
      }
    } catch (error) {
      console.error("Error updating transactions:", error);
      toast.error("Failed to update transactions");
    } finally {
      setUpdatingTransactions(false);
    }
  };
  
  const handleNetworkChange = (network: 'mainnet' | 'testnet') => {
    setActiveNetworkState(network);
    localStorage.setItem('userNetworkPreference', network);
    
    setActiveNetwork(network);
    
    if (consolidatedView) {
      setConsolidatedView(false);
    }
    
    setCurrentPage(1);
    fetchPurchases(true);
  };
  
  const toggleConsolidatedView = () => {
    setConsolidatedView(!consolidatedView);
    setCurrentPage(1);
    fetchPurchases(true);
  };
  
  useEffect(() => {
    const handleNetworkChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.network) {
        setActiveNetworkState(customEvent.detail.network);
        fetchPurchases(true);
      }
    };
    
    window.addEventListener('networkChanged', handleNetworkChange);
    return () => window.removeEventListener('networkChanged', handleNetworkChange);
  }, [currentWalletAddress]);
  
  useEffect(() => {
    const handleWalletChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("[PresalePurchases] Wallet event detected:", customEvent.detail);
      
      if (customEvent.detail?.action === 'disconnected') {
        console.log("[PresalePurchases] Wallet disconnected, clearing purchases");
        setPurchases([]);
        setTotalPurchases(0);
        setCurrentWalletAddress(null);
      } else if (customEvent.detail?.action === 'connected' && customEvent.detail?.wallet) {
        console.log("[PresalePurchases] Wallet connected, setting new address:", customEvent.detail.wallet);
        setCurrentWalletAddress(customEvent.detail.wallet);
      }
    };
    
    window.addEventListener('walletChanged', handleWalletChange);
    return () => window.removeEventListener('walletChanged', handleWalletChange);
  }, []);
  
  useEffect(() => {
    if (currentWalletAddress) {
      console.log("[PresalePurchases] Fetching purchases for wallet:", currentWalletAddress);
      fetchPurchases();
    } else {
      console.log("[PresalePurchases] No wallet address available, clearing purchases");
      setPurchases([]);
      setTotalPurchases(0);
      setLoading(false);
    }
  }, [currentWalletAddress, currentPage, activeNetwork, consolidatedView]);
  
  const totalPages = Math.ceil(totalPurchases / itemsPerPage);
  
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const getNetworkBadgeVariant = (network: string) => {
    return network === 'mainnet' ? 'success' : 'warning';
  };
  
  const copyWalletAddress = () => {
    if (!currentWalletAddress) return;
    
    navigator.clipboard.writeText(currentWalletAddress)
      .then(() => toast.success("Wallet address copied to clipboard"))
      .catch(() => toast.error("Failed to copy wallet address"));
  };
  
  if (loading && purchases.length === 0) {
    return <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }

  const hasPendingTransactions = purchases.some(purchase => purchase.status === 'pending');
  
  const renderWalletAddressBadge = () => {
    if (!currentWalletAddress) return null;
    
    const isEthereum = isEthereumAddress(currentWalletAddress);
    const walletName = profile?.wallet_type === 'phantom_ethereum' || isEthereum 
      ? 'Ethereum' 
      : 'Solana';
    
    return (
      <div className="mb-6 flex justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-full cursor-pointer"
                onClick={copyWalletAddress}
              >
                <Badge 
                  variant={walletName === 'Ethereum' ? 'outline' : 'secondary'}
                  className="font-medium"
                >
                  {walletName}
                </Badge>
                <span className="text-sm font-medium text-zinc-300">
                  {formatWalletAddress(currentWalletAddress, 6, 4)}
                </span>
                <Copy className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-200" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to copy full address</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };
  
  const renderNetworkToggles = () => {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 mb-6">
        <div className="flex items-center space-x-2 p-2 bg-zinc-800 rounded-lg">
          <span className={`text-sm ${activeNetwork === 'testnet' ? 'text-yellow-400 font-medium' : 'text-gray-400'}`}>Testnet</span>
          <Switch 
            checked={activeNetwork === 'mainnet'}
            onCheckedChange={(checked) => handleNetworkChange(checked ? 'mainnet' : 'testnet')}
            disabled={consolidatedView}
          />
          <span className={`text-sm ${activeNetwork === 'mainnet' ? 'text-green-400 font-medium' : 'text-gray-400'}`}>Mainnet</span>
          <Badge 
            variant={getNetworkBadgeVariant(activeNetwork)}
            className="ml-2"
          >
            {activeNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 p-2 bg-zinc-800 rounded-lg">
          <span className={`text-sm ${!consolidatedView ? 'text-gray-400' : 'text-blue-400 font-medium'}`}>Single Network</span>
          <Switch 
            checked={consolidatedView}
            onCheckedChange={toggleConsolidatedView}
          />
          <span className={`text-sm ${consolidatedView ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>All Networks</span>
          {consolidatedView && (
            <Badge 
              variant="default"
              className="ml-2"
            >
              Combined View
            </Badge>
          )}
        </div>
      </div>
    );
  };
  
  if (purchases.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        {renderWalletAddressBadge()}
        
        <h3 className="text-lg font-medium">No Purchases Found</h3>
        <p className="text-muted-foreground mt-2">
          {currentWalletAddress
            ? `You haven't made any token purchases ${consolidatedView ? '' : `on ${activeNetwork}`} with this wallet yet.`
            : "Please connect your wallet to view your purchases."}
        </p>
        
        {currentWalletAddress && renderNetworkToggles()}
        
        {currentWalletAddress && (
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={refreshPurchases}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        )}
        
        {currentWalletAddress && (
          <Button 
            variant="outline" 
            className="mt-4 ml-2" 
            onClick={updatePendingTransactions}
            disabled={updatingTransactions}
          >
            {updatingTransactions ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Pending
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return <div>
      {currentWalletAddress && <div className="mb-6">
          {renderWalletAddressBadge()}
          <TotalPurchasesDisplay 
            walletAddress={currentWalletAddress}
            walletType={profile?.wallet_type || localStorage.getItem('walletType') || null}
            activeNetwork={activeNetwork}
            consolidatedView={consolidatedView}
          />
        </div>}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-zinc-50">Your Purchases</h3>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshPurchases}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </>
            )}
          </Button>
          
          {hasPendingTransactions && (
            <Button size="sm" variant="outline" onClick={updatePendingTransactions} disabled={updatingTransactions}>
              {updatingTransactions ? <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Updating
                </> : "Update Pending"}
            </Button>
          )}
        </div>
      </div>
      
      {renderNetworkToggles()}
      
      <div className="space-y-4">
        {purchases.map(purchase => <Card key={purchase.id} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(purchase.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">
                  {purchase.currency === "SOL" ? `${purchase.sol_amount} SOL` : `${purchase.original_amount} ${purchase.currency}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="font-medium">{purchase.token_amount.toLocaleString()} CLAB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{purchase.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stage</p>
                <p className="font-medium">
                  {purchase.presale_stages ? purchase.presale_stages.name : "Unknown"}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {purchase.wallet_type === 'phantom' || purchase.wallet_type === 'solflare' ? 'Solana' : 'Ethereum'} Transaction
                  </p>
                  <Badge 
                    variant={getNetworkBadgeVariant(purchase.network || 'mainnet')}
                    className="text-xs px-2"
                  >
                    {purchase.network === 'testnet' ? 'Testnet' : 'Mainnet'}
                  </Badge>
                </div>
                <p className="font-medium text-xs truncate">
                  {purchase.tx_hash ? (
                    <a 
                      href={purchase.wallet_type === 'phantom_ethereum' || purchase.wallet_type === 'metamask' || isEthereumAddress(purchase.wallet_address)
                        ? `https://etherscan.io/tx/${purchase.tx_hash}`
                        : `https://solscan.io/tx/${purchase.tx_hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:underline"
                    >
                      {purchase.tx_hash.substring(0, 16)}...
                    </a>
                  ) : "N/A"}
                </p>
              </div>
            </div>
          </Card>)}
      </div>

      {totalPages > 1 && <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNumber = i + 1;

                if (pageNumber === 1 || pageNumber === totalPages || pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1) {
                  return <PaginationItem key={pageNumber}>
                          <PaginationLink isActive={pageNumber === currentPage} onClick={() => handlePageChange(pageNumber)} className="cursor-pointer">
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>;
                }

                if (pageNumber === 2 && currentPage > 3 || pageNumber === totalPages - 1 && currentPage < totalPages - 2) {
                  return <PaginationItem key={`ellipsis-${pageNumber}`}>
                          <PaginationEllipsis />
                        </PaginationItem>;
                }
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>}
    </div>;
};
