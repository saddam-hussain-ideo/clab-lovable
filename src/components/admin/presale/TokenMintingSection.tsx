
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenMintingForm } from "@/components/admin/token/TokenMintingForm";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TokenMintingSectionProps {
  tokenMintAddress: string;
  onMintSuccess?: () => void;
  distributionWallet?: any;
  isWalletConnected?: boolean;
  isOwner?: boolean | null;
}

export const TokenMintingSection = ({ 
  tokenMintAddress, 
  onMintSuccess,
  distributionWallet,
  isWalletConnected,
  isOwner
}: TokenMintingSectionProps) => {
  // Callback for when minting succeeds
  const handleMintSuccess = (txSignature: string) => {
    console.log("Mint transaction completed:", txSignature);
    if (onMintSuccess) {
      onMintSuccess();
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <CardTitle>Token Operations</CardTitle>
            <CardDescription>
              Mint and manage tokens for distribution
            </CardDescription>
          </div>
          {tokenMintAddress && (
            <Badge variant="outline" className="px-3 py-1">
              Token: {tokenMintAddress.slice(0, 4)}...{tokenMintAddress.slice(-4)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mint">
          <TabsList className="grid grid-cols-1 md:grid-cols-2">
            <TabsTrigger value="mint">Mint Tokens</TabsTrigger>
            <TabsTrigger value="balance">Token Balance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mint" className="mt-4">
            {tokenMintAddress ? (
              <TokenMintingForm 
                tokenMintAddress={tokenMintAddress}
                onMintSuccess={handleMintSuccess}
                distributionWallet={distributionWallet}
                isWalletConnected={isWalletConnected}
                isOwner={isOwner}
              />
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">
                  Please select or set a token mint address first
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="balance" className="mt-4">
            <div className="py-4">
              <p>Token balance functionality will be implemented soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
