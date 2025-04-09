
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Banner } from "@/types/banner";
import { AlertCircle, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BannerDebugger = () => {
  // Only render in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    return null; // Don't show in production
  }
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadBanners = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) throw error;
      
      setBanners(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch banners");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "URL has been copied to your clipboard",
    });
  };

  const getPublicUrl = (path: string) => {
    if (!path) return null;
    
    try {
      if (path.startsWith('http')) return path;
      
      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(path);
        
      return data.publicUrl;
    } catch (err) {
      return null;
    }
  };

  const testImageUrl = async (url: string) => {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const testAllImages = async () => {
    for (const banner of banners) {
      if (!banner.image_url) continue;
      
      const publicUrl = getPublicUrl(banner.image_url);
      if (!publicUrl) continue;
      
      const isValid = await testImageUrl(publicUrl);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-card">
      <h2 className="text-xl font-bold mb-4">Banner URL Debugger (Development Only)</h2>
      
      <div className="mb-6 flex gap-2">
        <Button onClick={loadBanners} disabled={isLoading}>
          {isLoading ? "Loading..." : "Load All Banners"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={testAllImages} 
          disabled={isLoading || banners.length === 0}
        >
          Test All Images
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="space-y-4">
        {banners.map((banner) => {
          const publicUrl = getPublicUrl(banner.image_url || "");
          
          return (
            <div key={banner.id} className="border rounded-md p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Banner: {banner.title}</h3>
                  <p className="text-muted-foreground text-sm">Position: {banner.position}</p>
                  <p className="text-muted-foreground text-sm">Active: {banner.is_active ? "Yes" : "No"}</p>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium">Raw URL in Database:</p>
                    <div className="flex items-center mt-1 gap-2">
                      <code className="bg-muted p-1 rounded text-xs break-all">
                        {banner.image_url || "No URL"}
                      </code>
                      {banner.image_url && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6" 
                          onClick={() => copyToClipboard(banner.image_url || "")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium">Public URL:</p>
                    <div className="flex items-center mt-1 gap-2">
                      <code className="bg-muted p-1 rounded text-xs break-all">
                        {publicUrl || "Could not generate"}
                      </code>
                      {publicUrl && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6" 
                          onClick={() => copyToClipboard(publicUrl)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  {publicUrl ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded overflow-hidden border">
                        <img 
                          src={publicUrl} 
                          alt={banner.title}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        Preview of banner image
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted rounded p-4">
                      <p className="text-muted-foreground">No image URL available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {banners.length === 0 && !isLoading && (
          <div className="text-center p-4 bg-muted rounded-md">
            Click "Load All Banners" to view banner data
          </div>
        )}
      </div>
    </div>
  );
};
