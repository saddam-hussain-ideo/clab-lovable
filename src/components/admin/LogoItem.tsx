
import { Logo, PendingUpload } from "@/types/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LogoItemProps {
  logo: Logo;
  pendingUpload?: PendingUpload;
  onUpload: (id: string, file: File) => void;
  onSave: (id: string) => void;
  onRemove: (id: string) => void;
}

const getDisplayUrl = (logo: Logo, pendingUpload?: PendingUpload) => {
  if (pendingUpload) {
    return supabase.storage
      .from('partner-logos')
      .getPublicUrl(pendingUpload.tempUrl)
      .data.publicUrl;
  }
  if (logo.image_url) {
    if (!logo.image_url.includes('storage/v1/object')) {
      return supabase.storage
        .from('partner-logos')
        .getPublicUrl(logo.image_url)
        .data.publicUrl;
    }
    return logo.image_url;
  }
  return null;
};

export const LogoItem = ({ logo, pendingUpload, onUpload, onSave, onRemove }: LogoItemProps) => {
  const displayUrl = getDisplayUrl(logo, pendingUpload);

  return (
    <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border flex items-center justify-between">
      <div className="space-y-2">
        <h3 className="font-semibold">{logo.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{logo.description}</p>
        <div className="flex items-center gap-4">
          {displayUrl && (
            <div className="relative w-12 h-12 bg-gray-100 dark:bg-zinc-700 rounded p-1">
              <img 
                src={displayUrl} 
                alt={logo.name} 
                className="absolute inset-0 w-full h-full object-contain filter dark:brightness-0 dark:invert"
                onError={(e) => {
                  console.error('Image load error for URL:', displayUrl);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(logo.id, file);
              }}
              className="max-w-xs"
            />
            {pendingUpload && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSave(logo.id)}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:text-red-700"
        onClick={() => onRemove(logo.id)}
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
};
