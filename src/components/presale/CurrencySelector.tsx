
import { Check } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  network: 'solana' | 'ethereum';
  disabled?: boolean;
}

export function CurrencySelector({ value, onChange, network, disabled = false }: CurrencySelectorProps) {
  // Define available currencies per network
  const solanaOptions = ['SOL', 'USDC', 'USDT'];
  const ethereumOptions = ['ETH', 'USDC', 'USDT'];
  
  // Get the correct options based on the network
  const options = network === 'solana' ? solanaOptions : ethereumOptions;
  
  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700">
        {options.map(option => (
          <SelectItem key={option} value={option} className="text-white hover:bg-gray-700">
            <div className="flex items-center">
              {option}
              {value === option && <Check className="h-4 w-4 ml-2" />}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
