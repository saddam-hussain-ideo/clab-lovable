
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, GraduationCap, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { Banner } from "@/types/banner";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface CarouselOptions {
  loop?: boolean;
  align?: "start" | "center" | "end";
  slidesToScroll?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
}

interface HeroBannerProps {
  banners: Banner[] | undefined;
  testMode?: boolean;
}

export const HeroBanner = ({
  banners,
  testMode = false
}: HeroBannerProps) => {
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [hasError, setHasError] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const autoplayOptions = useRef(Autoplay({
    delay: 5000,
    stopOnInteraction: false
  }));

  useEffect(() => {
    if (banners && banners.length > 0) {
      setInitialLoad(false);
      setHasError(false);
      const loadingState: Record<string, boolean> = {};
      banners.forEach(banner => {
        loadingState[banner.id] = false;
      });
      setImagesLoaded(loadingState);
    }
  }, [banners]);

  const testBanner: Banner = {
    id: 'test-banner',
    title: 'Welcome to Our Platform',
    subtitle: 'Test Banner to Verify Carousel Functionality',
    image_url: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
    is_active: true,
    position: 'hero',
    order: 1
  };

  const shouldUseTestBanner = testMode === true;
  const useRealBanners = !shouldUseTestBanner && banners && banners.length > 0;
  const bannersToDisplay = shouldUseTestBanner ? [testBanner] : useRealBanners ? banners : [testBanner];

  const carouselOptions: CarouselOptions = {
    loop: true,
    align: "start",
    slidesToScroll: 1
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    if (imageUrl.includes('banners/')) {
      try {
        const publicUrl = supabase.storage.from('banners').getPublicUrl(imageUrl).data.publicUrl;
        return publicUrl;
      } catch (error) {
        console.error("Error generating URL:", error);
        return null;
      }
    }
    return imageUrl;
  };

  const handleImageError = (bannerId: string) => {
    console.error(`Failed to load image for banner: ${bannerId}`);
    setImagesLoaded(prev => ({
      ...prev,
      [bannerId]: false
    }));
    setHasError(true);
  };

  const handleImageLoad = (bannerId: string) => {
    setImagesLoaded(prev => ({
      ...prev,
      [bannerId]: true
    }));
  };

  const productItems = [{
    title: "DEFI CARD",
    description: "Access the future of finance with our decentralized banking solution",
    icon: <CreditCard className="h-10 w-10 text-emerald-400" />,
    bgColor: "from-cyan-600/80 to-emerald-600/80",
    link: "/defi-card"
  }, {
    title: "CLAB ACADEMY",
    description: "Learn, earn, and master crypto with expert-led courses",
    icon: <GraduationCap className="h-10 w-10 text-violet-400" />,
    bgColor: "from-violet-600/80 to-purple-600/80",
    link: "/university"
  }, {
    title: "PRESALE",
    description: "Get early access to CLAB tokens before they moon",
    icon: <Coins className="h-10 w-10 text-amber-400" />,
    bgColor: "from-amber-600/80 to-orange-600/80",
    link: "/#presale"
  }];

  return <section className="relative pt-[80px] mb-0">
      <Carousel className="w-full max-h-[600px] overflow-hidden" opts={carouselOptions} plugins={[autoplayOptions.current]}>
        <CarouselContent>
          {bannersToDisplay.map(banner => <CarouselItem key={banner.id}>
              <div className="relative w-full">
                <div className="relative w-full max-h-[600px] overflow-hidden">
                  {banner.image_url ? <div className="relative w-full">
                      <img src={getImageUrl(banner.image_url)} alt={banner.title} className="w-full h-auto object-cover object-center" onError={() => handleImageError(banner.id)} onLoad={() => handleImageLoad(banner.id)} />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-zinc-900/50" />
                    </div> : <div className="aspect-[16/9] flex items-center justify-center bg-zinc-800">
                      <p className="text-white">No image available</p>
                    </div>}
                  
                  <div className="absolute inset-0 flex items-center justify-start text-left">
                    <div className="container flex flex-col items-start max-w-4xl my-0 py-0 mx-[85px] mt-28 px-[100px] hidden md:flex">
                      <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-2 md:mb-2 animate-fade-in text-white drop-shadow-lg">
                        {banner.title}
                      </h1>
                      
                      {banner.subtitle && 
                        <p className="text-base sm:text-lg md:text-xl text-gray-100 font-semibold animate-fade-in mx-0 px-0 mb-4 md:mb-8 max-w-2xl drop-shadow-md">
                          {banner.subtitle}
                        </p>
                      }
                      
                      <div className="w-full">
                        {banner.target_url && <Link to={banner.target_url}>
                            <Button className="animate-fade-in glass-card bg-white hover:bg-gray-100 text-black" size="lg">
                              {banner.button_text || 'Learn More'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-10 hidden md:block">
                    <CarouselPrevious className="h-10 w-10 rounded-full border-none bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white" />
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-10 hidden md:block">
                    <CarouselNext className="h-10 w-10 rounded-full border-none bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white" />
                  </div>
                </div>
              </div>
            </CarouselItem>)}
        </CarouselContent>
      </Carousel>
      
      <div className="relative bg-[#1A1F2C] py-8 z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {productItems.map((item, index) => <Link key={index} to={item.link} className="flex flex-col h-full transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
                <div className={`rounded-xl shadow-md backdrop-blur-md border border-white/10 overflow-hidden h-full bg-gradient-to-br ${item.bgColor}`}>
                  <div className="p-4 flex items-center h-full bg-slate-800">
                    <div className="mr-4">
                      <div className="rounded-full bg-white/10 p-2">
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="text-white/80 text-sm">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white ml-2 opacity-70" />
                  </div>
                </div>
              </Link>)}
          </div>
        </div>
      </div>
      
      <div className="block md:hidden w-full flex justify-center py-4 px-4 bg-black/80 -mt-2">
        {bannersToDisplay?.[0]?.target_url && <Link to={bannersToDisplay[0].target_url} className="w-full">
            <Button className="w-full animate-fade-in bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border border-emerald-500/20" size="lg">
              {bannersToDisplay[0].button_text || 'Learn More'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>}
      </div>
    </section>;
};

