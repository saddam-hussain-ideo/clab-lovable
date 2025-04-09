
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { fetchAllWalletPurchases, PurchaseData, isEthereumAddress } from "@/services/purchasesService";

interface UserContributionsProps {
  walletAddress: string | null;
  walletType?: string | null;
}

export const UserContributions = ({ walletAddress, walletType = 'phantom' }: UserContributionsProps) => {
  const [contributions, setContributions] = useState<PurchaseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [previousFilter, setPreviousFilter] = useState<string | null>(null);
  const currentWalletRef = useRef<string | null>(null);
  const currentWalletTypeRef = useRef<string | null>(null);

  useEffect(() => {
    const handleWalletChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("UserContributions: Wallet change event detected", customEvent.detail);
      
      if (customEvent.detail?.action === 'disconnected') {
        setContributions([]);
        currentWalletRef.current = null;
        currentWalletTypeRef.current = null;
      }
    };
    
    window.addEventListener('walletChanged', handleWalletChange);
    return () => window.removeEventListener('walletChanged', handleWalletChange);
  }, []);

  const fetchContributions = async (specificWalletType?: string | null) => {
    if (!walletAddress) {
      setContributions([]);
      setIsLoading(false);
      return;
    }
    
    const typeToUse = specificWalletType !== undefined ? specificWalletType : activeFilter;
    
    if (typeToUse === previousFilter && contributions.length > 0) {
      console.log("Skipping fetch for same wallet type", typeToUse);
      return;
    }
    
    setPreviousFilter(typeToUse);
    
    // Make sure we normalize the wallet address for comparison
    const normalizedCurrentWallet = currentWalletRef.current?.toLowerCase();
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const isEthereum = isEthereumAddress(normalizedWalletAddress);
    
    if (normalizedCurrentWallet === normalizedWalletAddress && 
        currentWalletTypeRef.current === typeToUse && 
        specificWalletType === undefined &&
        contributions.length > 0) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      currentWalletRef.current = walletAddress;
      currentWalletTypeRef.current = typeToUse;
      
      setContributions([]);
      
      // For Ethereum addresses, handle wallet types differently
      let effectiveWalletType = typeToUse;
      
      // If it's an "all" filter on an Ethereum address, set type to null to get all Ethereum transactions
      if (!effectiveWalletType && isEthereum) {
        console.log("Ethereum address detected, fetching all Ethereum wallet types");
        // effectiveWalletType stays null to fetch all Ethereum transactions
      }
      
      // Use the utility service to fetch transactions from all networks
      const { data: allContributions } = await fetchAllWalletPurchases(
        normalizedWalletAddress,
        effectiveWalletType,
        1,  // First page
        100 // Get a large number of results
      );
      
      console.log(`Found total of ${allContributions.length} contributions for ${normalizedWalletAddress}`);
      setContributions(allContributions);
    } catch (error) {
      console.error("Failed to fetch contributions:", error);
      setError("Failed to load your contribution data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filter: string | null) => {
    if (filter === activeFilter) {
      return;
    }
    
    setActiveFilter(filter);
    fetchContributions(filter);
  };

  useEffect(() => {
    fetchContributions();
  }, [walletAddress, walletType]);

  if (!walletAddress) {
    return null;
  }

  if (isLoading && contributions.length === 0) {
    return (
      <Card className="p-4 mt-4 bg-white/5 border border-white/20">
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <p>Loading contributions...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 mt-4 bg-white/5 border border-white/20">
        <div className="flex items-center text-red-400">
          <AlertCircle className="h-4 w-4 mr-2" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (contributions.length === 0 && !isLoading) {
    return null;
  }

  // Always show wallet type filter options for better UX
  const hasMultipleWalletTypes = true;

  return (
    <Card className="p-4 mt-4 bg-white/5 border border-white/20">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-semibold">Your Contributions</h4>
        
        {hasMultipleWalletTypes && (
          <ButtonGroup 
            value={activeFilter || 'all'} 
            onValueChange={(value) => handleFilterChange(value === 'all' ? null : value)}
            className="bg-background/10 border border-zinc-800 rounded-md"
            buttonClassName="px-3 py-1.5 text-sm font-medium text-zinc-400"
            activeButtonClassName="bg-zinc-800 text-white"
          >
            <ButtonGroup.Item value="all">All</ButtonGroup.Item>
            <ButtonGroup.Item value="phantom">Solana</ButtonGroup.Item>
            <ButtonGroup.Item value="phantom_ethereum">Ethereum</ButtonGroup.Item>
          </ButtonGroup>
        )}
      </div>
      
      <div className="space-y-3">
        {contributions.map((contribution) => (
          <div key={contribution.id} className="flex justify-between items-center border-b border-white/10 pb-2">
            <div>
              <div className="font-semibold">
                {contribution.currency === "SOL" 
                  ? `${contribution.sol_amount} SOL` 
                  : `${contribution.currency ? `${contribution.original_amount} ${contribution.currency}` : "Unknown"}`}
              </div>
              <div className="text-xs text-gray-400">
                {contribution.wallet_type === 'phantom_ethereum' || contribution.wallet_type === 'metamask' || isEthereumAddress(contribution.wallet_address)
                  ? 'Ethereum' 
                  : 'Solana'}
              </div>
              {contribution.presale_stages && (
                <div className="text-xs text-emerald-400">
                  {contribution.presale_stages.name}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold">
                {Math.floor(contribution.token_amount).toLocaleString()} CLAB
              </div>
              <div className="text-xs">
                {contribution.status === 'pending' ? 'Pending Distribution' : 
                 contribution.status === 'ready_for_distribution' ? 'Ready for Distribution' :
                 contribution.status === 'completed' ? 'Distributed' : contribution.status}
              </div>
            </div>
          </div>
        ))}
      </div>
      {isLoading && contributions.length > 0 && (
        <div className="flex justify-center mt-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </Card>
  );
};
