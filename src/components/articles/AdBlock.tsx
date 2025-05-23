
import { supabase } from "@/lib/supabase";

interface AdBlockProps {
  ad?: {
    target_url: string;
    image_url: string;
  } | null;
  className?: string;
}

export const AdBlock = ({ ad, className }: AdBlockProps) => {
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
    <div className={`glass-card rounded-xl overflow-hidden backdrop-blur-lg bg-white/5 border border-white/10 ${className}`}>
      <p className="text-xs text-gray-400 p-2 text-center">Advertisement</p>
      <a 
        href={ad.target_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full relative hover:opacity-95 transition-opacity"
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
