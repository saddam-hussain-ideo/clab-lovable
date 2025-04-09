import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '../ui/spinner';
import { z } from '@/lib/zod-config';
import { Profile } from '@/types/profile';
import { supabase } from '@/lib/supabase';
import { toast as sonnerToast } from 'sonner';
import { AvatarUpload } from './AvatarUpload';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface PersonalInfoFormProps {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  onSuccess?: () => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ 
  profile, 
  setProfile, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  console.log("[PersonalInfoForm] Rendering with profile:", {
    id: profile?.id,
    username: profile?.username,
    wallet: profile?.wallet_address,
    walletType: profile?.wallet_type,
    email: profile?.email
  });

  // Create a simplified username schema
  const usernameSchema = z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(50, { message: 'Username cannot exceed 50 characters' })
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      message: 'Username can only contain letters, numbers, underscores, dots, and hyphens',
    });

  // Create a schema for form validation
  const formSchema = z.object({
    username: usernameSchema
      .refine(async (username) => {
        // Skip validation if no change or empty username
        if (!username || (profile?.username === username)) {
          setUsernameAvailable(null);
          return true;
        }
        
        setIsCheckingUsername(true);
        setUsernameAvailable(null);
        
        try {
          const { data, error } = await supabase.rpc(
            'is_username_taken', 
            { 
              p_username: username,
              p_current_user_id: profile?.id
            }
          );

          setIsCheckingUsername(false);
          
          if (error) {
            console.error('[PersonalInfoForm] Error checking username:', error);
            // If there's an error, allow submission but log the error
            return true;
          }
          
          // Update availability state for UI feedback
          setUsernameAvailable(!data);
          
          // Return true if username is NOT taken (data will be false)
          return !data;
        } catch (err) {
          console.error('[PersonalInfoForm] Exception checking username:', err);
          setIsCheckingUsername(false);
          setUsernameAvailable(null);
          return true;
        }
      }, { message: 'This username is already taken. Please choose another.' }),
  });

  // Define the type for form values using zod
  type FormValues = z.infer<typeof formSchema>;

  // Initialize the form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
    mode: 'onChange',
  });

  // Fallback profile for if data is missing
  const createFallbackProfile = () => {
    const walletAddress = localStorage.getItem('walletAddress');
    const walletType = localStorage.getItem('walletType');
    
    if (!walletAddress || !walletType) {
      console.warn('[PersonalInfoForm] No wallet data found in localStorage');
    } else {
      console.log('[PersonalInfoForm] Created fallback profile with wallet:', walletAddress.slice(0, 8));
    }
    
    return {
      id: null,
      username: '',
      avatar_url: null,
      wallet_address: walletAddress,
      wallet_type: walletType,
      points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Profile;
  };

  useEffect(() => {
    if (profile) {
      console.log('[PersonalInfoForm] Setting form values from profile:', {
        username: profile.username
      });
      form.reset({
        username: profile.username || ''
      });
    } else if (localStorage.getItem('walletAddress')) {
      // If we have a wallet but no profile, create a fallback profile
      const fallbackProfile = createFallbackProfile();
      console.log('[PersonalInfoForm] Created fallback profile for wallet:', fallbackProfile);
      setProfile(fallbackProfile);
      form.reset({
        username: ''
      });
    }
  }, [profile, form, setProfile]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    // Get current profile or create fallback
    const currentProfile = profile || createFallbackProfile();
    
    if (!currentProfile.wallet_address || !currentProfile.wallet_type) {
      console.error('[PersonalInfoForm] Cannot submit - missing wallet data');
      sonnerToast.error('Profile data is missing', {
        description: 'Please connect your wallet first and try again'
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const sanitizedUsername = values.username.trim();
      
      // Create updated profile object
      const updatedProfile: Profile = {
        ...currentProfile,
        username: sanitizedUsername,
        updated_at: new Date().toISOString()
      };
      
      console.log('[PersonalInfoForm] Saving profile with data:', {
        id: updatedProfile.id,
        username: updatedProfile.username,
        wallet: updatedProfile.wallet_address,
        type: updatedProfile.wallet_type || 'unknown'
      });
      
      // Check if profile is using a wallet (no user authentication)
      if (currentProfile.wallet_address && currentProfile.wallet_type) {
        console.log('[PersonalInfoForm] Updating wallet-based profile with conditions:', {
          wallet_address: currentProfile.wallet_address,
          wallet_type: currentProfile.wallet_type
        });
        
        // First, ensure the profile exists in the database
        // This is a critical step to ensure we're updating an existing record
        const { data: existingProfile, error: checkError } = await supabase
          .from('wallet_profiles')
          .select('id')
          .eq('wallet_address', currentProfile.wallet_address)
          .eq('wallet_type', currentProfile.wallet_type)
          .maybeSingle();
        
        if (checkError) {
          console.error('[PersonalInfoForm] Error checking profile existence:', checkError);
          throw checkError;
        }
        
        if (!existingProfile) {
          console.log('[PersonalInfoForm] No existing profile found, creating new profile');
          // Profile doesn't exist, so create it
          const { data: insertData, error: insertError } = await supabase
            .from('wallet_profiles')
            .insert({
              wallet_address: currentProfile.wallet_address,
              wallet_type: currentProfile.wallet_type,
              username: sanitizedUsername,
              avatar_url: currentProfile.avatar_url,
              points: currentProfile.points || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('*');
          
          if (insertError) {
            console.error('[PersonalInfoForm] Error creating profile:', insertError);
            throw insertError;
          }
          
          if (insertData && insertData.length > 0) {
            // Use the newly created profile with its database ID
            const newProfile = insertData[0];
            console.log('[PersonalInfoForm] Created new profile with ID:', newProfile.id);
            
            // Update local state with the database-generated profile
            setProfile(newProfile as Profile);
            
            // Update cache
            localStorage.setItem(`profile_${currentProfile.wallet_type}_${currentProfile.wallet_address}`, 
              JSON.stringify(newProfile));
              
            // Show success message
            sonnerToast.success('Profile created successfully!');
            
            onSuccess?.();
          }
        } else {
          console.log('[PersonalInfoForm] Found existing profile with ID:', existingProfile.id);
          // Profile exists, update it using its ID
          const { error: updateError } = await supabase
            .from('wallet_profiles')
            .update({
              username: sanitizedUsername,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProfile.id);
          
          if (updateError) {
            console.error('[PersonalInfoForm] Error updating profile:', updateError);
            throw updateError;
          }
          
          // Update profile using the setProfile function from props
          const finalProfile = {
            ...updatedProfile,
            id: existingProfile.id
          };
          setProfile(finalProfile);
          
          // Update cache
          localStorage.setItem(`profile_${currentProfile.wallet_type}_${currentProfile.wallet_address}`, 
            JSON.stringify(finalProfile));
          
          console.log('[PersonalInfoForm] Successfully updated profile with ID:', existingProfile.id);
          
          // Show success message
          sonnerToast.success('Profile updated successfully!');
          
          onSuccess?.();
        }
      } else {
        // For authenticated users, update through Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: sanitizedUsername,
          })
          .eq('id', currentProfile.id);
          
        if (updateError) {
          throw updateError;
        }
        
        // Update profile in state
        setProfile(updatedProfile);
        
        // Show success message
        sonnerToast.success('Profile updated successfully!');
        
        onSuccess?.();
      }
      
      // Reset username availability state
      setUsernameAvailable(null);
    } catch (err: any) {
      setError(err);
      sonnerToast.error('Failed to update profile', {
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = 
    isLoading || 
    isUploading || 
    isCheckingUsername || 
    usernameAvailable === false ||
    !form.formState.isDirty;

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar upload section */}
          <div className="md:col-span-1">
            <AvatarUpload 
              profile={profile || createFallbackProfile()} 
              setProfile={setProfile} 
              isUploading={isUploading} 
              setIsUploading={setIsUploading} 
            />
          </div>
          
          {/* Username form section */}
          <div className="md:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your username"
                            {...field}
                            className={
                              usernameAvailable === true 
                                ? "border-green-500 focus-visible:ring-green-500" 
                                : usernameAvailable === false 
                                  ? "border-red-500 focus-visible:ring-red-500" 
                                  : ""
                            }
                          />
                          {isCheckingUsername && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <Spinner className="h-4 w-4" />
                            </div>
                          )}
                          {!isCheckingUsername && usernameAvailable === true && field.value !== profile?.username && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500">
                              ✓
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Username must be 3-50 characters and can only contain letters, numbers, underscores, dots, and hyphens.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitDisabled} className="bg-black hover:bg-black/90">
                  {isLoading ? (
                    <>
                      Updating <Spinner className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>}
              </form>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  );
};
