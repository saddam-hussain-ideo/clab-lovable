import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Profile } from "@/types/profile";
import { useState, useEffect } from "react";

interface AvatarUploadProps {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
}

// Default avatar image path
const DEFAULT_AVATAR = "/lovable-uploads/988144ca-38fb-4273-a0cf-e82e64218efc.png";

export const AvatarUpload = ({ profile, setProfile, isUploading, setIsUploading }: AvatarUploadProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Update the avatar URL when the profile changes
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    } else {
      setAvatarUrl(DEFAULT_AVATAR);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    console.log("[AvatarUpload] Starting upload for file:", file.name, "size:", file.size, "type:", file.type);

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
      // Check if this is a wallet-only user
      const isWalletUser = !profile.email && profile.wallet_address;
      console.log("[AvatarUpload] User type: wallet-only =", isWalletUser);
      
      if (isWalletUser) {
        // For wallet users, convert the image to a data URL and store it directly
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target && event.target.result) {
            const dataUrl = event.target.result as string;
            
            // Update profile with data URL
            const updatedProfile = {
              ...profile,
              avatar_url: dataUrl
            };
            
            // Save to database using our service
            if (profile.wallet_address && profile.wallet_type) {
              console.log("[AvatarUpload] Saving wallet profile with new avatar");
              
              // First, check if profile exists in the database
              const { data: existingProfile, error: checkError } = await supabase
                .from('wallet_profiles')
                .select('id')
                .eq('wallet_address', profile.wallet_address)
                .eq('wallet_type', profile.wallet_type)
                .maybeSingle();
              
              if (checkError) {
                console.error('[AvatarUpload] Error checking profile existence:', checkError);
                toast.error("Error checking profile. Please try again.");
                setIsUploading(false);
                return;
              }
              
              let success = false;
              let savedProfileId = null;
              
              if (!existingProfile) {
                // Create new profile
                console.log("[AvatarUpload] No existing profile found, creating new one");
                const { data: insertData, error: insertError } = await supabase
                  .from('wallet_profiles')
                  .insert({
                    wallet_address: profile.wallet_address,
                    wallet_type: profile.wallet_type,
                    username: profile.username || `${profile.wallet_type}_${profile.wallet_address.slice(0, 6)}`,
                    avatar_url: dataUrl,
                    points: profile.points || 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select('*');
                
                if (insertError) {
                  console.error('[AvatarUpload] Error creating profile:', insertError);
                  toast.error("Failed to create profile with avatar");
                  setIsUploading(false);
                  return;
                }
                
                if (insertData && insertData.length > 0) {
                  success = true;
                  savedProfileId = insertData[0].id;
                  updatedProfile.id = savedProfileId;
                  console.log('[AvatarUpload] Created new profile with ID:', savedProfileId);
                }
              } else {
                // Update existing profile
                console.log("[AvatarUpload] Updating existing profile with ID:", existingProfile.id);
                const { error: updateError } = await supabase
                  .from('wallet_profiles')
                  .update({
                    avatar_url: dataUrl,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingProfile.id);
                
                if (updateError) {
                  console.error('[AvatarUpload] Error updating profile:', updateError);
                  toast.error("Failed to update avatar");
                  setIsUploading(false);
                  return;
                }
                
                success = true;
                savedProfileId = existingProfile.id;
                updatedProfile.id = savedProfileId;
              }
              
              if (success) {
                // Also update the profile in localStorage cache for immediate persistence
                try {
                  const cacheKey = `profile_${profile.wallet_type}_${profile.wallet_address}`;
                  localStorage.setItem(cacheKey, JSON.stringify(updatedProfile));
                  console.log("[AvatarUpload] Updated profile cache:", cacheKey);
                } catch (cacheError) {
                  console.error('[AvatarUpload] Failed to update profile cache:', cacheError);
                }
                
                // Update profile state
                setProfile(updatedProfile);
                setAvatarUrl(dataUrl);
                
                toast.success("Avatar updated successfully");
              } else {
                toast.error("Failed to save avatar to database");
              }
            }
          }
          setIsUploading(false);
        };
        
        reader.onerror = () => {
          toast.error("Failed to process image. Please try again.");
          setIsUploading(false);
        };
        
        reader.readAsDataURL(file);
        return;
      }
      
      // For registered users, continue with Supabase storage upload
      if (profile.avatar_url && profile.avatar_url !== DEFAULT_AVATAR) {
        const oldAvatarPath = profile.avatar_url.split('/').pop();
        if (oldAvatarPath) {
          console.log("[AvatarUpload] Removing old avatar:", oldAvatarPath);
          await supabase.storage
            .from('avatars')
            .remove([`${profile.id}/${oldAvatarPath}`]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${crypto.randomUUID()}.${fileExt}`;
      console.log("[AvatarUpload] Uploading new avatar to:", fileName);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log("[AvatarUpload] File uploaded, public URL:", publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error('[AvatarUpload] Error uploading avatar:', error);
      toast.error("Failed to update avatar. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-center">
      <Label className="block text-sm font-medium mb-2">Profile Picture</Label>
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24">
          <AvatarImage 
            src={avatarUrl || DEFAULT_AVATAR} 
            alt={profile?.username || 'Avatar'} 
          />
          <AvatarFallback>
            <img src={DEFAULT_AVATAR} alt="CLAB" className="h-full w-full object-cover" />
          </AvatarFallback>
        </Avatar>
        <div className="w-full">
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <Button asChild variant="default" disabled={isUploading} className="bg-black hover:bg-black/90 w-full">
              <label className="cursor-pointer flex items-center justify-center">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Image"}
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </Button>
          </Label>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Max 5MB
          </p>
        </div>
      </div>
    </div>
  );
};
