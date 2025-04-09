
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaymentButtonProps {
  currency: 'SOL' | 'USDC' | 'USDT';
  amount: string;
  isProcessing: boolean;
  onClick: () => Promise<void>;
}

export const PaymentButton = ({ currency, amount, isProcessing, onClick }: PaymentButtonProps) => {
  // Handle click with event prevention
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onClick();
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isProcessing} // Only disable when processing
      className="w-full"
      type="button" // Explicitly set type to prevent form submission
    >
      {isProcessing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      Buy CLAB with {currency}
      <span className="ml-2 text-xs">{amount} {currency}</span>
    </Button>
  );
};
