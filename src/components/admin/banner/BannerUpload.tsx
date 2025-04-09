
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";

interface BannerUploadProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploading: boolean;
  position: 'hero' | 'blog';
}

export const BannerUpload = ({ onUpload, uploading, position }: BannerUploadProps) => {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (uploading || !e.target.files || e.target.files.length === 0) return;
    
    await onUpload(e);
    
    // Clear the input value to allow uploading the same file again
    if (e.target) {
      e.target.value = '';
    }
  };
  
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">{position === 'hero' ? 'Hero' : 'Blog'} Banner Management</h2>
      <div>
        <Input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id={`banner-upload-${position}`}
          data-position={position}
        />
        <Label htmlFor={`banner-upload-${position}`}>
          <Button disabled={uploading} asChild>
            <span>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Banner
                </>
              )}
            </span>
          </Button>
        </Label>
      </div>
    </div>
  );
};
