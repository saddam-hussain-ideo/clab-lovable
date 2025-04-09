
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AdType } from "./types";

interface AdTypeSelectorProps {
  value: AdType;
  onChange: (value: AdType) => void;
}

export const AdTypeSelector = ({ value, onChange }: AdTypeSelectorProps) => {
  return (
    <div>
      <Label className="text-base font-semibold mb-4 block">Advertisement Position</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange as (value: string) => void}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="banner" id="banner" />
          <Label htmlFor="banner">Banner Advertisement (728x90)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sidebar" id="sidebar" />
          <Label htmlFor="sidebar">Sidebar Advertisement (300x250)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="leaderboard" id="leaderboard" />
          <Label htmlFor="leaderboard">Leaderboard Advertisement (728x90)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
