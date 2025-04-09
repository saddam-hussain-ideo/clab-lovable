
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEXT_COLOR_OPTIONS } from "./utils";

interface TextColorSelectorProps {
  onSelectColor: (color: string) => void;
}

export const TextColorSelector = ({ onSelectColor }: TextColorSelectorProps) => {
  const [selectedTextColor, setSelectedTextColor] = useState<string>('');

  const applyTextColor = () => {
    if (!selectedTextColor) return;
    onSelectColor(selectedTextColor);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedTextColor} onValueChange={setSelectedTextColor}>
        <SelectTrigger id="text-color" className="w-24 h-8">
          <SelectValue placeholder="Color" />
        </SelectTrigger>
        <SelectContent>
          {TEXT_COLOR_OPTIONS.map(color => (
            <SelectItem 
              key={color.value} 
              value={color.value}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${color.value.replace('text-', 'bg-')}`}></div>
                <span>{color.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={applyTextColor}
        disabled={!selectedTextColor}
        className="h-8"
      >
        Apply
      </Button>
    </div>
  );
};
