
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Logo, PendingUpload } from "@/types/logo";
import { useToast } from "@/hooks/use-toast";

export const useLogos = () => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const { toast } = useToast();

  const fetchLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_logos')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process logos to ensure we have valid public URLs
      const logosWithValidUrls = data?.map(logo => {
        if (logo.image_url) {
          // Always get a fresh public URL from storage for any image_url
          const { data: { publicUrl } } = supabase.storage
            .from('partner-logos')
            .getPublicUrl(logo.image_url);
          console.log(`Converting ${logo.image_url} to ${publicUrl}`);
          return { ...logo, image_url: publicUrl };
        }
        return logo;
      });

      console.log('Fetched and processed logos:', logosWithValidUrls);
      setLogos(logosWithValidUrls || []);
    } catch (error) {
      console.error('Error fetching logos:', error);
      toast({
        title: "Error",
        description: "Failed to load partner logos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (id: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('partner-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      setPendingUploads(prev => [
        ...prev.filter(p => p.logoId !== id),
        { logoId: id, tempUrl: fileName, fileName }
      ]);

      toast({
        title: "Success",
        description: "Logo uploaded successfully. Click Save to apply changes.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo image",
        variant: "destructive",
      });
    }
  };

  const handleSaveLogo = async (id: string) => {
    const pendingUpload = pendingUploads.find(p => p.logoId === id);
    if (!pendingUpload) return;

    try {
      const { error: updateError } = await supabase
        .from('partner_logos')
        .update({ 
          image_url: pendingUpload.fileName, // Store just the filename
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Get the public URL after saving
      const { data: { publicUrl } } = supabase.storage
        .from('partner-logos')
        .getPublicUrl(pendingUpload.fileName);

      // Update local state with the public URL
      setLogos(logos.map(logo => 
        logo.id === id ? { ...logo, image_url: publicUrl } : logo
      ));

      setPendingUploads(prev => prev.filter(p => p.logoId !== id));

      toast({
        title: "Success",
        description: "Logo changes saved successfully",
      });

      await fetchLogos();
    } catch (error) {
      console.error('Error saving logo:', error);
      toast({
        title: "Error",
        description: "Failed to save logo changes",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLogo = async (id: string) => {
    try {
      const logo = logos.find(l => l.id === id);
      if (logo?.image_url) {
        // Extract just the filename from the full URL
        const fileName = logo.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('partner-logos')
            .remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('partner_logos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLogos(logos.filter(logo => logo.id !== id));
      setPendingUploads(prev => prev.filter(p => p.logoId !== id));
      
      toast({
        title: "Success",
        description: "Partner logo removed successfully",
      });
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: "Error",
        description: "Failed to remove partner logo",
        variant: "destructive",
      });
    }
  };

  const handleAddLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_logos')
        .insert({
          name: 'New Partner',
          description: 'Description',
        })
        .select()
        .single();

      if (error) throw error;

      setLogos([...logos, data]);
      toast({
        title: "Success",
        description: "New partner logo added successfully",
      });
    } catch (error) {
      console.error('Error adding logo:', error);
      toast({
        title: "Error",
        description: "Failed to add new partner logo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  return {
    logos,
    loading,
    pendingUploads,
    handleImageUpload,
    handleSaveLogo,
    handleRemoveLogo,
    handleAddLogo,
  };
};
