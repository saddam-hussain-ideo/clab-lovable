
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface BlogBanner {
  title: string;
  subtitle?: string | null;
  image_url: string;
  target_url?: string | null;
  button_text?: string | null;
}

interface BlogBannerProps {
  banner: BlogBanner | null;
}

export const BlogBanner = ({ banner }: BlogBannerProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  if (!banner) return null;
  
  // If there's no image_url, we can't display the banner
  if (!banner.image_url) return null;

  // Process the banner image URL
  const getImageUrl = (imageUrl: string): string => {
    console.log("BlogBanner - Processing image URL:", imageUrl);
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http')) {
      console.log("BlogBanner - Already full URL:", imageUrl);
      return imageUrl;
    }
    
    // Generate public URL
    try {
      const publicUrl = supabase.storage
        .from('banners')
        .getPublicUrl(imageUrl)
        .data.publicUrl;
      
      console.log("BlogBanner - Generated public URL:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("BlogBanner - Error generating URL:", error);
      return imageUrl; // Fallback to the original URL
    }
  };
  
  const bannerImageUrl = getImageUrl(banner.image_url);
  
  if (!bannerImageUrl) return null;

  const handleImageError = () => {
    console.error("Failed to load blog banner image:", banner.image_url);
    console.error("Processed URL was:", bannerImageUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log("Blog banner image loaded successfully");
    setImageLoaded(true);
  };

  // If image failed to load, don't show the banner
  if (imageError) return null;

  return (
    <div className="relative pt-16">
      <div className="relative aspect-[16/9] w-full max-h-[600px]">
        <img
          src={bannerImageUrl}
          alt={banner.title}
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {banner.title}
            </h1>
            {banner.subtitle && (
              <p className="text-xl text-gray-200">
                {banner.subtitle}
              </p>
            )}
            {banner.target_url && (
              <a
                href={banner.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 px-8 py-3 bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
              >
                {banner.button_text || "Learn More"}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
