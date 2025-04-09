
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface WalletConnectButtonProps {
  onClick: () => Promise<void>;
  isConnecting: boolean;
  iconUrl: string;
  walletName: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function WalletConnectButton({
  onClick,
  isConnecting,
  iconUrl,
  walletName,
  variant = "outline",
  className = ""
}: WalletConnectButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      className={`w-full flex items-center justify-between mb-1 bg-gray-800 hover:bg-gray-700 ${className}`}
      disabled={isConnecting}
    >
      <div className="flex items-center">
        <div className="h-5 w-5 mr-2 flex items-center justify-center">
          <img
            alt={walletName}
            className="h-5 w-5"
            src={iconUrl}
          />
        </div>
        <span>Connect {walletName}</span>
      </div>
      {isConnecting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
    </Button>
  );
}
