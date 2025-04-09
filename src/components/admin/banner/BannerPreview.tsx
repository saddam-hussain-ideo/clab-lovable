
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeroBanner } from "@/components/home/HeroBanner";
import { Banner } from "@/types/banner";

interface BannerPreviewProps {
  heroBanners: Banner[];
  blogBanners: Banner[];
}

export const BannerPreview = ({ heroBanners, blogBanners }: BannerPreviewProps) => {
  const [testMode, setTestMode] = useState(false);
  const [bannerType, setBannerType] = useState<'hero' | 'blog'>('hero');
  
  const bannersToShow = bannerType === 'hero' ? heroBanners : blogBanners;
  
  console.log(`BannerPreview: testMode=${testMode}, bannerType=${bannerType}, banners:`, bannersToShow);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Banner Preview</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="test-mode" 
                checked={testMode} 
                onCheckedChange={(checked) => {
                  console.log("Setting test mode to:", checked);
                  setTestMode(checked);
                }} 
              />
              <Label htmlFor="test-mode">Test Mode</Label>
            </div>
            
            <Select value={bannerType} onValueChange={(value) => setBannerType(value as 'hero' | 'blog')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Banner Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero Banners</SelectItem>
                <SelectItem value="blog">Blog Banners</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <HeroBanner 
            banners={bannersToShow} 
            testMode={testMode} 
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {testMode 
            ? "Showing test banner to verify display functionality" 
            : `Showing ${bannersToShow.length} ${bannerType} banner${bannersToShow.length !== 1 ? 's' : ''}`}
        </p>
      </CardContent>
    </Card>
  );
};
