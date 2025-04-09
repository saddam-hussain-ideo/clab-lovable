
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { fetchTotalPurchaseAmount, isEthereumAddress } from "@/services/purchasesService";

interface TotalPurchasesDisplayProps {
  walletAddress: string;
  walletType?: string | null;
  activeNetwork?: string;
  consolidatedView?: boolean;
}

export const TotalPurchasesDisplay = ({ 
  walletAddress,
  walletType,
  activeNetwork = 'mainnet',
  consolidatedView = false
}: TotalPurchasesDisplayProps) => {
  const [totalPurchase, setTotalPurchase] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalPurchase = async () => {
      if (!walletAddress) {
        setTotalPurchase(0);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Normalize wallet address to lowercase for consistent lookups
        const normalizedAddress = walletAddress.toLowerCase();
        
        // Detect if this is an Ethereum address
        const isEthAddress = isEthereumAddress(normalizedAddress);
        
        // Use the effective wallet type for Ethereum addresses
        let effectiveWalletType = walletType;
        
        // For Ethereum addresses with unspecified or incorrect wallet type, use a more reliable approach
        if (isEthAddress) {
          // If it's an Ethereum address but wallet type doesn't match known Ethereum wallet types,
          // we need to use a reliable wallet type to ensure we get all Ethereum transactions
          if (!effectiveWalletType || 
              (effectiveWalletType !== 'phantom_ethereum' && 
               effectiveWalletType !== 'metamask')) {
            // Use null to retrieve all Ethereum transactions regardless of wallet type
            effectiveWalletType = null;
          }
        }
        
        console.log(`Fetching total purchase for ${normalizedAddress} with type ${effectiveWalletType || 'all'} on network ${consolidatedView ? 'both' : activeNetwork}`);
        
        // Fetch total purchase amount using the service with normalized address, effective wallet type, and network
        const total = await fetchTotalPurchaseAmount(normalizedAddress, effectiveWalletType, activeNetwork, consolidatedView);
        
        console.log(`Total purchase amount for ${normalizedAddress} on ${consolidatedView ? 'all networks' : activeNetwork}: ${total} CLAB`);
        setTotalPurchase(total);
      } catch (error) {
        console.error("Error fetching total purchase:", error);
        setError("Failed to load total purchases");
        setTotalPurchase(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalPurchase();
  }, [walletAddress, walletType, activeNetwork, consolidatedView]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-4 flex justify-center text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  // Determine the network display text
  let networkLabel = consolidatedView 
    ? 'All Networks' 
    : (activeNetwork === 'mainnet' ? 'Mainnet' : 'Testnet');
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Total Purchased ({networkLabel})
          </p>
          <p className="text-3xl font-bold text-emerald-500">
            {totalPurchase !== null ? totalPurchase.toLocaleString() : 0} CLAB
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
