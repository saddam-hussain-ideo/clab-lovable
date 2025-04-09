import { Button } from "@/components/ui/button";
import { Facebook, X, Linkedin, Mail, Share2 } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  text: string;
  url: string;
}

export const ShareButtons = ({ title, text, url }: ShareButtonsProps) => {
  const handleShare = async (platform: string) => {
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      mail: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    };

    if (platform === 'native') {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
      return;
    }

    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('facebook')}
        className="bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border-[#1877F2]/50"
      >
        <Facebook size={18} className="text-[#1877F2]" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('twitter')}
        className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border-[#1DA1F2]/50"
      >
        <X size={18} className="text-[#1DA1F2]" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('linkedin')}
        className="bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border-[#0A66C2]/50"
      >
        <Linkedin size={18} className="text-[#0A66C2]" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('mail')}
        className="bg-[#EA4335]/10 hover:bg-[#EA4335]/20 border-[#EA4335]/50"
      >
        <Mail size={18} className="text-[#EA4335]" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('native')}
        className="bg-white/10 hover:bg-white/20 border-white/50"
      >
        <Share2 size={18} className="text-white" />
      </Button>
    </div>
  );
};
