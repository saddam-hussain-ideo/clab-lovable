
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Upload, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Banner } from "@/types/banner";

interface BannerItemProps {
  banner: Banner;
  onUpdate: (banner: Partial<Banner> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageUpdate: (id: string, event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const BannerItem = ({ banner, onUpdate, onDelete, onImageUpdate }: BannerItemProps) => {
  const [formData, setFormData] = useState({
    title: banner.title,
    subtitle: banner.subtitle || '',
    target_url: banner.target_url || '',
    button_text: banner.button_text || 'Learn More',
    is_active: banner.is_active
  });
  const [imageUrl, setImageUrl] = useState<string>('/placeholder.svg');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update form data when banner changes
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      target_url: banner.target_url || '',
      button_text: banner.button_text || 'Learn More',
      is_active: banner.is_active
    });

    // Generate and set image URL
    if (banner.image_url) {
      try {
        const publicUrl = supabase.storage
          .from('banners')
          .getPublicUrl(banner.image_url)
          .data.publicUrl;
        
        setImageUrl(publicUrl);
        console.log("Banner image URL:", publicUrl);
      } catch (error) {
        console.error("Error getting public URL for banner image:", error);
        setImageUrl('/placeholder.svg');
      }
    }
  }, [banner]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await onUpdate({
        id: banner.id,
        ...formData
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading) return;
    
    setLoading(true);
    try {
      await onImageUpdate(banner.id, e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return;
    
    if (window.confirm('Are you sure you want to delete this banner?')) {
      setLoading(true);
      try {
        await onDelete(banner.id);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="relative">
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImageUrl('/placeholder.svg')}
              />
            </div>
            <div className="absolute bottom-2 right-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpdate}
                className="hidden"
                id={`image-upload-${banner.id}`}
                disabled={loading}
              />
              <Label htmlFor={`image-upload-${banner.id}`}>
                <Button size="sm" variant="secondary" asChild disabled={loading}>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Update Image
                  </span>
                </Button>
              </Label>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Recommended size: 1920x1080px (16:9)
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor={`title-${banner.id}`}>Title</Label>
            <Input
              id={`title-${banner.id}`}
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor={`subtitle-${banner.id}`}>Subtitle</Label>
            <Input
              id={`subtitle-${banner.id}`}
              value={formData.subtitle}
              onChange={(e) => handleInputChange('subtitle', e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor={`url-${banner.id}`}>Target URL</Label>
            <Input
              id={`url-${banner.id}`}
              value={formData.target_url}
              onChange={(e) => handleInputChange('target_url', e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor={`button-${banner.id}`}>Button Text</Label>
            <Input
              id={`button-${banner.id}`}
              value={formData.button_text}
              onChange={(e) => handleInputChange('button_text', e.target.value)}
              placeholder="Learn More"
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                disabled={loading}
              />
              <Label>Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
