
import { ButtonGroup } from "@/components/ui/button-group";

interface ProfileTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export const ProfileTabs = ({ activeTab, onChange }: ProfileTabsProps) => {
  return (
    <ButtonGroup 
      value={activeTab} 
      onValueChange={onChange}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 w-full mb-0 bg-zinc-800 border-t border-x border-zinc-700 rounded-b-none rounded-t-md"
      buttonClassName="py-3 text-zinc-300 hover:text-white border-none rounded-none"
      activeButtonClassName="bg-zinc-900 text-white font-semibold"
    >
      <ButtonGroup.Item value="info">
        Personal Info
      </ButtonGroup.Item>
      <ButtonGroup.Item value="purchases">
        Purchases
      </ButtonGroup.Item>
      <ButtonGroup.Item value="quiz">
        Quiz
      </ButtonGroup.Item>
      <ButtonGroup.Item value="favorites">
        Favorites
      </ButtonGroup.Item>
      <ButtonGroup.Item value="deficard">
        DEFI Card
      </ButtonGroup.Item>
    </ButtonGroup>
  );
};
