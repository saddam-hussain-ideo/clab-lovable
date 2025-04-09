
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { AdImageUpload } from "./AdImageUpload";
import { AdTypeSelector } from "./AdTypeSelector";
import { Switch } from "@/components/ui/switch";
import { Advertisement, AdFormData, AdType } from "./types";

export const AdFormSection = () => {
  const queryClient = useQueryClient();
  
  const [adData, setAdData] = useState<AdFormData>({
    imageUrl: "",
    targetUrl: "",
    type: "sidebar",
    isActive: true
  });

  const { mutate: updateAd, isPending: isUpdatingAd } = useMutation({
    mutationFn: async (newAd: AdFormData) => {
      console.log("Submitting ad data:", newAd);
      
      try {
        // First, set all ads of this type to inactive
        const { error: updateError } = await supabase
          .from('advertisements')
          .update({ is_active: false })
          .eq('type', newAd.type);
          
        if (updateError) {
          console.error("Error deactivating existing ads:", updateError);
          throw updateError;
        }

        // Then insert the new ad with position set to "primary" or default
        const { data, error } = await supabase
          .from('advertisements')
          .insert({
            image_url: newAd.imageUrl,
            target_url: newAd.targetUrl,
            type: newAd.type,
            is_active: newAd.isActive,
            position: 'primary' // Make sure to set a position value
          })
          .select();

        if (error) {
          console.error("Error inserting new ad:", error);
          throw error;
        }
        
        console.log("Advertisement created successfully:", data);
        return data;
      } catch (error: any) {
        console.error("Detailed error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Advertisement updated successfully");
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
      setAdData({ imageUrl: "", targetUrl: "", type: "sidebar", isActive: true });
    },
    onError: (error: any) => {
      console.error('Error updating ad:', error);
      toast.error(`Failed to update advertisement: ${error?.message || 'Unknown error'}`);
    }
  });

  const handleAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adData.imageUrl) {
      toast.error("Please upload an image first");
      return;
    }
    
    if (!adData.targetUrl) {
      toast.error("Please provide a target URL");
      return;
    }

    try {
      new URL(adData.targetUrl);
    } catch (error) {
      toast.error("Please provide a valid URL (e.g., https://example.com)");
      return;
    }
    
    console.log("Submitting ad form with data:", adData);
    updateAd(adData);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <form onSubmit={handleAdSubmit} className="space-y-6">
        <AdTypeSelector
          value={adData.type}
          onChange={(value) => setAdData(prev => ({ ...prev, type: value as AdType }))}
        />

        <AdImageUpload
          imageUrl={adData.imageUrl}
          onImageUploaded={(url) => setAdData(prev => ({ ...prev, imageUrl: url }))}
          disabled={isUpdatingAd}
        />

        <div>
          <Label className="block text-sm font-medium mb-2">Target URL</Label>
          <Input
            type="url"
            value={adData.targetUrl}
            onChange={(e) => setAdData(prev => ({ ...prev, targetUrl: e.target.value }))}
            placeholder="https://example.com"
            required
            disabled={isUpdatingAd}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="ad-active-toggle"
            checked={adData.isActive}
            onCheckedChange={(checked) => setAdData(prev => ({ ...prev, isActive: checked }))}
            disabled={isUpdatingAd}
          />
          <Label htmlFor="ad-active-toggle">Active</Label>
        </div>

        <Button 
          type="submit" 
          disabled={isUpdatingAd || !adData.imageUrl}
        >
          {isUpdatingAd ? "Updating..." : "Update Advertisement"}
        </Button>
      </form>
    </div>
  );
};
