import { Instagram, X, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SocialMediaLink {
  platform: string;
  url: string;
}

interface Props {
  className?: string;
  iconClassName?: string;
}

export const SocialMediaLinks = ({ className = "", iconClassName = "" }: Props) => {
  const [links, setLinks] = useState<SocialMediaLink[]>([]);

  useEffect(() => {
    const fetchLinks = async () => {
      const { data } = await supabase
        .from('social_media_links')
        .select('platform, url')
        .order('platform');
      
      if (data) setLinks(data);
    };

    fetchLinks();
  }, []);

  const getIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <X className={iconClassName || "h-5 w-5"} />;
      case 'telegram':
        return <Send className={iconClassName || "h-5 w-5"} />;
      case 'instagram':
        return <Instagram className={iconClassName || "h-5 w-5"} />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {links.map((link) => (
        <a
          key={link.platform}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white"
        >
          {getIcon(link.platform)}
        </a>
      ))}
    </div>
  );
};
