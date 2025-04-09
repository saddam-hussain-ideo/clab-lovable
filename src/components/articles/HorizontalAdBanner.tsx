
import { supabase } from "@/lib/supabase";

interface HorizontalAdBannerProps {
  ad?: {
    target_url: string;
    image_url: string;
  } | null;
  className?: string;
}

export const HorizontalAdBanner = ({ ad, className }: HorizontalAdBannerProps) => {
  if (!ad?.image_url) return null;
  
  // Check if the image URL is already a full URL
  const imageUrl = ad.image_url.startsWith('http') 
    ? ad.image_url 
    : supabase.storage
        .from('advertisements')
        .getPublicUrl(ad.image_url)
        .data.publicUrl;
  
  if (!imageUrl) return null;

  return (
    <div className={`w-full max-w-[1200px] mx-auto ${className}`}>
      <div className="text-xs text-gray-400 text-center mb-1">Advertisement</div>
      <a 
        href={ad.target_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full max-h-[90px] hover:opacity-95 transition-opacity bg-white/5 border border-white/10 rounded-md overflow-hidden"
      >
        <img
          src={imageUrl}
          alt="Advertisement"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Failed to load ad image:', imageUrl);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </a>
    </div>
  );
};
