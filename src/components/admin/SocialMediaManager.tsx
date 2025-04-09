
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
}

export const SocialMediaManager = () => {
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .order('platform');

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching social media links:', error);
      toast({
        title: "Error",
        description: "Failed to load social media links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLink = async (id: string, url: string) => {
    try {
      const { error } = await supabase
        .from('social_media_links')
        .update({ url, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Social media link updated successfully",
      });

      // Update local state
      setLinks(links.map(link => 
        link.id === id ? { ...link, url } : link
      ));
    } catch (error) {
      console.error('Error updating social media link:', error);
      toast({
        title: "Error",
        description: "Failed to update social media link",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-zinc-300">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6 text-zinc-100">Manage Social Media Links</h2>

      <div className="grid gap-6">
        {links.map((link) => (
          <Card key={link.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold capitalize text-zinc-100">{link.platform}</h3>
                <div className="flex gap-4">
                  <Input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      setLinks(links.map(l => 
                        l.id === link.id ? { ...l, url: newUrl } : l
                      ));
                    }}
                    className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                    placeholder={`Enter ${link.platform} URL`}
                  />
                  <Button
                    onClick={() => updateLink(link.id, link.url)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
