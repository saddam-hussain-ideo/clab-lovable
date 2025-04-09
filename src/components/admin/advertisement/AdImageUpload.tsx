
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AdImageUploadProps {
  imageUrl: string;
  onImageUploaded: (url: string) => void;
  disabled?: boolean;
}

export const AdImageUpload = ({ imageUrl, onImageUploaded, disabled }: AdImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      console.log("Starting upload process...");
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log(`Uploading file to path: ${filePath}`);
      const { data, error: uploadError } = await supabase.storage
        .from('advertisement-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log("Upload successful, getting public URL...");
      const { data: { publicUrl } } = supabase.storage
        .from('advertisement-images')
        .getPublicUrl(filePath);

      console.log(`Generated public URL: ${publicUrl}`);
      onImageUploaded(publicUrl);
      
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('Error details:', error.message);
      toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <Label className="block text-sm font-medium mb-2">Advertisement Image</Label>
      <div className="space-y-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={disabled || isUploading}
        />
        {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}
        {imageUrl && (
          <div className="relative w-full max-w-md">
            <img
              src={imageUrl}
              alt="Ad preview"
              className="w-full object-contain rounded-md border border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-1">Preview: {imageUrl.split('/').pop()}</p>
          </div>
        )}
      </div>
    </div>
  );
};
