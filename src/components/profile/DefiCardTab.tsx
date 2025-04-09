
import React from 'react';
import { DefiCardForm } from './DefiCardForm';
import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Profile } from '@/types/profile';
import useDefiCardEligibility from '@/hooks/useDefiCardEligibility';
import { Loader2 } from 'lucide-react';

export const DefiCardTab = ({ profile }: { profile: Profile | null }) => {
  const { walletAddress: connectedWalletAddress } = useWallet();
  const walletAddress = profile?.wallet_address || connectedWalletAddress || null;
  const { isEligible, hasRegistered, totalPurchaseAmount, minRequiredAmount, loading, error } = useDefiCardEligibility(walletAddress);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="text-red-700">{error}</p>
        <p className="mt-2 text-sm text-red-600">Please try again later or contact support if the issue persists.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <DefiCardForm 
        walletAddress={walletAddress} 
        isEligible={isEligible}
        hasRegistered={hasRegistered}
        totalPurchaseAmount={totalPurchaseAmount}
        minRequiredAmount={minRequiredAmount}
      />
    </div>
  );
};
