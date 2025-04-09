
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Banner } from "@/types/banner";
import { useState } from "react";

export const useBanners = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<boolean>(false);

  const bannersQuery = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .order('order', { ascending: true });

        if (error) {
          console.error("Error fetching banners:", error);
          throw error;
        }
        
        console.log("Fetched banners:", data);
        return data || [];
      } catch (error: any) {
        console.error("Failed to fetch banners:", error);
        toast({
          title: "Error loading banners",
          description: error.message || "Failed to load banners. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    retry: 1
  });

  const createBanner = async (imageUrl: string, position: 'hero' | 'blog') => {
    try {
      // Get the maximum order for the given position
      const { data: existingBanners, error: orderError } = await supabase
        .from('banners')
        .select('order')
        .eq('position', position)
        .order('order', { ascending: false })
        .limit(1);

      if (orderError) throw orderError;

      const nextOrder = existingBanners && existingBanners.length > 0 
        ? (existingBanners[0].order + 1) 
        : 1;

      const newBanner = {
        title: `New ${position === 'hero' ? 'Hero' : 'Blog'} Banner`,
        image_url: imageUrl,
        position,
        is_active: true,
        order: nextOrder
      };

      const { error } = await supabase
        .from('banners')
        .insert(newBanner);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({
        title: "Banner created",
        description: "New banner has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error creating banner",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error:', error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    bannerId?: string
  ) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setUploading(true);

    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `banners/${bannerId || crypto.randomUUID()}.${fileExt}`;
      const position = (event.target as HTMLInputElement & { dataset: { position?: string } })?.dataset?.position as 'hero' | 'blog' || 'hero';

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      console.log("File uploaded successfully:", filePath);
      
      // If bannerId is provided, update that banner, otherwise create a new one
      if (bannerId) {
        await updateBanner({
          id: bannerId,
          image_url: filePath
        });
        toast({
          title: "Image updated",
          description: "Banner image has been updated successfully",
        });
      } else {
        await createBanner(filePath, position);
      }
      
      return filePath;
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const updateBanner = async (banner: Partial<Banner> & { id: string }) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update(banner)
        .eq('id', banner.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({
        title: "Banner updated",
        description: "Banner has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating banner",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error updating banner:', error);
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({
        title: "Banner deleted",
        description: "Banner has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting banner",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error deleting banner:', error);
    }
  };

  const reorderBanner = async (id: string, direction: 'up' | 'down') => {
    try {
      // Use the custom reorder_banner database function we created
      const { error } = await supabase.rpc('reorder_banner', {
        banner_id: id,
        move_direction: direction
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({
        title: "Banner reordered",
        description: "Banner has been reordered successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error reordering banner",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error reordering banner:', error);
    }
  };

  return {
    banners: bannersQuery.data,
    isLoading: bannersQuery.isLoading,
    isError: bannersQuery.isError,
    error: bannersQuery.error,
    uploading,
    handleFileUpload,
    updateBanner,
    deleteBanner,
    reorderBanner
  };
};
