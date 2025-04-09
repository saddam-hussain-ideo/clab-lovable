
import { BannerItem } from "./banner/BannerItem";
import { BannerUpload } from "./banner/BannerUpload"; 
import { BannerDebugger } from "./banner/BannerDebugger";
import { BannerPreview } from "./banner/BannerPreview";
import { useBanners } from "@/hooks/useBanners";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import type { Banner } from "@/types/banner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

export const BannerManager = () => {
  const { 
    banners, 
    isLoading, 
    isError, 
    error, 
    uploading,
    handleFileUpload, 
    updateBanner, 
    deleteBanner, 
    reorderBanner 
  } = useBanners();
  
  const [showDebugger, setShowDebugger] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileUpload(event);
  };

  const handleImageUpdate = async (bannerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileUpload(event, bannerId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading banners...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading banners</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load banners. Please try again."}
        </AlertDescription>
      </Alert>
    );
  }

  const heroBanners = banners?.filter(banner => banner.position === 'hero')
    .sort((a, b) => a.order - b.order) || [];
  const blogBanners = banners?.filter(banner => banner.position === 'blog')
    .sort((a, b) => a.order - b.order) || [];

  console.log("Hero banners:", heroBanners);
  console.log("Blog banners:", blogBanners);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Banner Management</h1>
        <Button variant="outline" onClick={() => setShowDebugger(!showDebugger)}>
          {showDebugger ? "Hide Debugger" : "Show URL Debugger"}
        </Button>
      </div>
      
      {showDebugger && (
        <div className="mb-8">
          <BannerDebugger />
        </div>
      )}

      {/* Banner Preview Section */}
      <BannerPreview heroBanners={heroBanners} blogBanners={blogBanners} />
      <Separator className="my-6" />
      
      <Tabs defaultValue="hero" className="w-full">
        <TabsList>
          <TabsTrigger value="hero">Hero Banners ({heroBanners.length})</TabsTrigger>
          <TabsTrigger value="blog">Blog Banners ({blogBanners.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hero" className="space-y-6">
          <BannerUpload onUpload={handleUpload} uploading={uploading} position="hero" />
          <div className="grid gap-6">
            {heroBanners.length === 0 ? (
              <div className="text-center p-6 bg-muted rounded-lg">
                <p className="text-muted-foreground">No hero banners found. Upload your first banner.</p>
              </div>
            ) : (
              heroBanners.map((banner: Banner) => (
                <div key={banner.id} className="flex items-start gap-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => reorderBanner(banner.id, 'up')}
                      disabled={banner.order === 1}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => reorderBanner(banner.id, 'down')}
                      disabled={banner.order === heroBanners.length}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <BannerItem 
                      banner={banner}
                      onUpdate={updateBanner}
                      onDelete={deleteBanner}
                      onImageUpdate={handleImageUpdate}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="blog" className="space-y-6">
          <BannerUpload onUpload={handleUpload} uploading={uploading} position="blog" />
          <div className="grid gap-6">
            {blogBanners.length === 0 ? (
              <div className="text-center p-6 bg-muted rounded-lg">
                <p className="text-muted-foreground">No blog banners found. Upload your first banner.</p>
              </div>
            ) : (
              blogBanners.map((banner: Banner) => (
                <div key={banner.id} className="flex items-start gap-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => reorderBanner(banner.id, 'up')}
                      disabled={banner.order === 1}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => reorderBanner(banner.id, 'down')}
                      disabled={banner.order === blogBanners.length}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <BannerItem
                      banner={banner}
                      onUpdate={updateBanner}
                      onDelete={deleteBanner}
                      onImageUpdate={handleImageUpdate}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
