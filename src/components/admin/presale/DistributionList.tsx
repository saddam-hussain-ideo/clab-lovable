
import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tokenDistributionService } from "@/services/tokenDistributionService";
import { toast } from "sonner";
import { distributeTokensToRecipients } from "@/utils/token/tokenMintingUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Distribution {
  id: number;
  address: string;
  amount: number;
}

interface DistributionListProps {
  distributions: Distribution[];
  wallet: any;
  tokenMintAddress: string;
  onDistributionComplete?: () => void;
  isLoading?: boolean;
}

export const DistributionList = ({ 
  distributions, 
  wallet, 
  tokenMintAddress, 
  onDistributionComplete,
  isLoading = false
}: DistributionListProps) => {
  const [selectedRecipients, setSelectedRecipients] = useState<Distribution[]>([]);
  const [distributingTokens, setDistributingTokens] = useState(false);
  const [currentDistributionId, setCurrentDistributionId] = useState<number | null>(null);
  const [results, setResults] = useState<{[key: number]: {success: boolean, message?: string}}>({});

  const toggleRecipient = (recipient: Distribution) => {
    if (selectedRecipients.some(r => r.id === recipient.id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipient.id));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const selectAllRecipients = () => {
    if (selectedRecipients.length === distributions.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients([...distributions]);
    }
  };

  const distributeTokens = async () => {
    if (!wallet || !wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!tokenMintAddress) {
      toast.error("Token mint address is required");
      return;
    }

    if (selectedRecipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    setDistributingTokens(true);
    const newResults = { ...results };
    const completedIds: number[] = [];

    try {
      for (const recipient of selectedRecipients) {
        try {
          setCurrentDistributionId(recipient.id);
          
          console.log(`Distributing ${recipient.amount} tokens to ${recipient.address} using wallet:`, wallet);
          
          // Send tokens to the recipient
          const result = await distributeTokensToRecipients(
            wallet, 
            tokenMintAddress, 
            [{ 
              address: recipient.address, 
              amount: recipient.amount 
            }]
          );

          if (result.success) {
            newResults[recipient.id] = { 
              success: true,
              message: `Successfully sent ${recipient.amount} tokens to ${recipient.address.slice(0, 4)}...${recipient.address.slice(-4)}`
            };
            completedIds.push(recipient.id);
          } else {
            newResults[recipient.id] = { 
              success: false, 
              message: result.error || "Failed to distribute tokens" 
            };
          }
        } catch (error: any) {
          newResults[recipient.id] = { 
            success: false, 
            message: error.message || "Transaction failed" 
          };
          console.error(`Error distributing to ${recipient.address}:`, error);
        }
      }

      setResults(newResults);

      // Mark completed distributions in the database
      if (completedIds.length > 0) {
        try {
          await tokenDistributionService.markContributionsAsDistributed(completedIds);
          toast.success(`Successfully distributed tokens to ${completedIds.length} recipients`);
          
          // Remove distributed recipients from selection
          setSelectedRecipients(selectedRecipients.filter(r => !completedIds.includes(r.id)));
          
          // Trigger callback to refresh data
          if (onDistributionComplete) {
            onDistributionComplete();
          }
        } catch (error) {
          console.error("Error marking distributions as completed:", error);
          toast.error("Failed to update distribution status in database");
        }
      }
    } catch (error: any) {
      console.error("Error in distribution process:", error);
      toast.error(error.message || "Failed to distribute tokens");
    } finally {
      setDistributingTokens(false);
      setCurrentDistributionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading distribution data...</span>
      </div>
    );
  }

  if (!distributions || distributions.length === 0) {
    return (
      <Alert variant="default" className="bg-muted/50">
        <AlertDescription>
          No pending distributions found. All tokens have been distributed or there are no completed purchases.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if wallet is properly connected
  const isWalletReady = wallet && wallet.publicKey;
  const walletAddress = isWalletReady ? wallet.publicKey.toString() : null;

  return (
    <div className="space-y-4">
      {!isWalletReady && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Please connect a distribution wallet above to distribute tokens to recipients.
          </AlertDescription>
        </Alert>
      )}
      
      {isWalletReady && walletAddress && (
        <Alert variant="default" className="bg-muted/50 mb-4">
          <Check className="h-4 w-4 mr-2 text-green-500" />
          <AlertDescription>
            Using wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
          </AlertDescription>
        </Alert>
      )}
    
      <div className="flex justify-between items-center">
        <Button 
          onClick={selectAllRecipients} 
          variant="outline" 
          size="sm"
          disabled={!isWalletReady}
        >
          {selectedRecipients.length === distributions.length 
            ? "Deselect All" 
            : "Select All"}
        </Button>
        
        <Button
          onClick={distributeTokens}
          disabled={distributingTokens || selectedRecipients.length === 0 || !isWalletReady || !tokenMintAddress}
          className="gap-2"
        >
          {distributingTokens ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Distributing...
            </>
          ) : (
            <>Distribute Tokens ({selectedRecipients.length})</>
          )}
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Select</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distributions.map((distribution) => {
              const isSelected = selectedRecipients.some(r => r.id === distribution.id);
              const isProcessing = distributingTokens && currentDistributionId === distribution.id;
              const result = results[distribution.id];
              
              return (
                <TableRow 
                  key={distribution.id}
                  className={isSelected ? "bg-muted/40" : ""}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRecipient(distribution)}
                      disabled={distributingTokens || !isWalletReady}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {distribution.address.substring(0, 6)}...{distribution.address.substring(distribution.address.length - 4)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {distribution.amount.toLocaleString()} tokens
                  </TableCell>
                  <TableCell>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : result ? (
                      result.success ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{result.message || "Failed to distribute tokens"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {Object.keys(results).length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Distribution Results</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
            {Object.entries(results).map(([id, result]) => (
              <div 
                key={id} 
                className={`text-sm p-2 rounded ${result.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}
              >
                {result.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
