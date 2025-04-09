
import { WalletDisplay } from "@/components/wallet/WalletDisplay";

interface ConnectedWalletDisplayProps {
  walletAddress: string;
  walletType: string;
  onDisconnect?: () => void;
}

export function ConnectedWalletDisplay({ 
  walletAddress, 
  walletType,
  onDisconnect
}: ConnectedWalletDisplayProps) {
  if (!walletAddress) {
    return null;
  }

  return (
    <div className="mb-3 p-3 bg-gray-800/50 rounded-md border border-gray-700">
      <WalletDisplay 
        walletAddress={walletAddress}
        walletType={walletType as any}
        onDisconnect={onDisconnect}
        variant="default"
      />
    </div>
  );
}
