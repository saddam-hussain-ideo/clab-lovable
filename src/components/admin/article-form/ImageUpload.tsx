
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ImageUploadProps {
  imageUrl: string;
  onChange: (imageUrl: string) => void;
  isSubmitting: boolean;
}

export const ImageUpload = ({ imageUrl, onChange, isSubmitting }: ImageUploadProps) => {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      
      toast.success("Image has been uploaded successfully");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isSubmitting}
          className="flex-1"
        />
        {imageUrl && (
          <div className="relative w-16 h-16">
            <img
              src={imageUrl}
              alt="Article preview"
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        )}
      </div>
      {imageUrl && (
        <Input
          value={imageUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL"
          disabled
        />
      )}
    </div>
  );
};
