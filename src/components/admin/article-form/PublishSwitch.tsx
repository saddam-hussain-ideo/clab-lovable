
import { Switch } from "@/components/ui/switch";

interface PublishSwitchProps {
  status: 'draft' | 'published';
  onChange: (status: 'draft' | 'published') => void;
}

export const PublishSwitch = ({ status, onChange }: PublishSwitchProps) => {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={status === 'published'}
        onCheckedChange={(checked) => 
          onChange(checked ? 'published' : 'draft')
        }
      />
      <span className="text-sm">
        {status === 'published' ? 'Publish immediately' : 'Save as draft'}
      </span>
    </div>
  );
};
