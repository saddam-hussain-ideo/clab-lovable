
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mintTokensToATA, checkMintAuthority } from "@/utils/token/tokenMintingUtils";

interface TokenMintingFormProps {
  tokenMintAddress: string;
  onMintSuccess?: (txSignature: string) => void;
  distributionWallet?: any;
  isWalletConnected?: boolean;
  isOwner?: boolean | null;
}

export const TokenMintingForm = ({ 
  tokenMintAddress, 
  onMintSuccess,
  distributionWallet,
  isWalletConnected = false,
  isOwner = null
}: TokenMintingFormProps) => {
  const [amount, setAmount] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMintAuthority, setIsMintAuthority] = useState<boolean | null>(isOwner);
  const [authorityChecked, setAuthorityChecked] = useState(isOwner !== null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [network, setNetwork] = useState(() => localStorage.getItem('activeNetwork') || 'testnet');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Use the owner state from parent if it's provided
  useEffect(() => {
    if (isOwner !== null) {
      setIsMintAuthority(isOwner);
      setAuthorityChecked(true);
      
      if (!isOwner) {
        console.log("User's wallet is not the mint authority according to parent verification");
        setErrorMessage("Your connected wallet is not the mint authority for this token");
      } else {
        setErrorMessage(null);
      }
    }
  }, [isOwner]);
  
  // Check if the connected wallet is the mint authority (only if not already verified by parent)
  const checkAuthority = async () => {
    if (!tokenMintAddress || !isWalletConnected || !distributionWallet || isOwner !== null) return;
    
    try {
      setErrorMessage(null);
      console.log("Checking mint authority for wallet:", distributionWallet);
      const result = await checkMintAuthority(distributionWallet, tokenMintAddress);
      setIsMintAuthority(result.isMintAuthority);
      setAuthorityChecked(true);
      
      if (!result.isMintAuthority) {
        const message = "Connected wallet is not the mint authority for this token";
        setErrorMessage(message);
        toast.error(message);
      }
    } catch (error: any) {
      console.error("Error checking mint authority:", error);
      setErrorMessage(error.message || "Failed to check mint authority");
      toast.error(error.message || "Failed to check mint authority");
    }
  };
  
  // Effect to check mint authority when wallet connects (if not verified by parent)
  useEffect(() => {
    if (isWalletConnected && distributionWallet && tokenMintAddress && !authorityChecked) {
      checkAuthority();
    }
  }, [isWalletConnected, distributionWallet, tokenMintAddress, authorityChecked]);
  
  // Update network when it changes in localStorage
  useEffect(() => {
    const handleNetworkChange = () => {
      setNetwork(localStorage.getItem('activeNetwork') || 'testnet');
    };
    
    window.addEventListener('storage', handleNetworkChange);
    return () => window.removeEventListener('storage', handleNetworkChange);
  }, []);
  
  const handleMint = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!tokenMintAddress) {
      toast.error("Token mint address is required");
      return;
    }
    
    if (!isWalletConnected || !distributionWallet) {
      toast.error("Please connect your wallet");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    setDebugInfo(null);
    
    try {
      const finalDestination = destinationAddress.trim() || (distributionWallet.publicKey ? distributionWallet.publicKey.toString() : null);
      
      if (!finalDestination) {
        throw new Error("No destination address available");
      }
      
      console.log("Minting tokens using distribution wallet:", distributionWallet);
      console.log("Current network:", network);
      console.log("Token mint address:", tokenMintAddress);
      
      setDebugInfo(`Minting ${amount} tokens to ${finalDestination.substring(0, 8)}...${finalDestination.substring(finalDestination.length - 8)}`);
      
      const result = await mintTokensToATA(
        distributionWallet,
        tokenMintAddress,
        parseFloat(amount),
        finalDestination
      );
      
      if (result.success && result.txSignature) {
        toast.success(`Successfully minted ${amount} tokens`);
        setAmount("");
        setDebugInfo(null);
        
        if (onMintSuccess) {
          onMintSuccess(result.txSignature);
        }
      } else {
        throw new Error(result.error || "Failed to mint tokens");
      }
    } catch (error: any) {
      console.error("Error minting tokens:", error);
      const errorMsg = error.message || "Failed to mint tokens";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine wallet address to display
  const walletAddress = distributionWallet?.publicKey ? 
    distributionWallet.publicKey.toString() : null;
  
  // Check if we have all requirements to mint
  const canMint = isWalletConnected && 
                 !!distributionWallet && 
                 !!tokenMintAddress && 
                 (authorityChecked === true && isMintAuthority === true);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mint Tokens</CardTitle>
        <CardDescription>
          Mint tokens to an associated token account. You must be the mint authority.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isWalletConnected && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet Required</AlertTitle>
            <AlertDescription>
              Please connect a distribution wallet above to mint tokens.
            </AlertDescription>
          </Alert>
        )}
        
        {isWalletConnected && walletAddress && (
          <Alert variant="default" className="bg-muted/50">
            <AlertDescription>
              Using wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              <div className="text-xs mt-1">Network: {network === 'mainnet' ? 'Mainnet' : 'Devnet'}</div>
            </AlertDescription>
          </Alert>
        )}
        
        <Alert variant="outline" className="bg-amber-50/10 border-amber-200">
          <Info className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm text-amber-800">
            Make sure you have at least 0.01 SOL in your wallet for transaction fees.
            Token minting requires both SOL to pay for the transaction and mint authority permission.
          </AlertDescription>
        </Alert>
        
        {authorityChecked && !isMintAuthority && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Authorized</AlertTitle>
            <AlertDescription>
              Your connected wallet is not the mint authority for this token.
              Only the mint authority can mint new tokens.
            </AlertDescription>
          </Alert>
        )}
        
        {authorityChecked && isMintAuthority && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Mint Authority Confirmed</AlertTitle>
            <AlertDescription>
              Your wallet is authorized to mint tokens.
            </AlertDescription>
          </Alert>
        )}
        
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
              {errorMessage.includes("IncorrectProgramId") && (
                <div className="mt-2 text-sm">
                  This error typically occurs when the token mint address is not a valid SPL token, or 
                  when there's a program ID mismatch. Please verify that you're using a valid token mint address.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {debugInfo && (
          <Alert variant="default" className="bg-blue-50/10 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              {debugInfo}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount to Mint</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.000001"
          />
          <p className="text-sm text-gray-500">
            Enter the amount of tokens you want to mint
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="destination">
            Destination Address (Optional)
          </Label>
          <Input
            id="destination"
            placeholder="Enter destination wallet address (defaults to your wallet)"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            If left empty, tokens will be minted to your connected wallet
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleMint}
          disabled={isLoading || !canMint}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting...
            </>
          ) : (
            "Mint Tokens"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
