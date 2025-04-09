import { useArticles } from "@/hooks/useArticles";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { HomeContent } from "@/lib/types/cms";
import { HeroBanner } from "@/components/home/HeroBanner";
import { NewsMarquee } from "@/components/home/NewsMarquee";
import { PresaleSection } from "@/components/home/PresaleSection";
import { DefiBanner } from "@/components/home/DefiBanner";
import { PlatformHighlights } from "@/components/home/PlatformHighlights";
import { PartnersSection } from "@/components/home/PartnersSection";
import { NewsSection } from "@/components/home/NewsSection";
import { UniversitySection } from "@/components/home/UniversitySection";
import { PresalePromoStrip } from "@/components/home/PresalePromoStrip";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { toast } from "@/hooks/use-toast";
import { Banner } from "@/types/banner";
import { Layout } from "@/components/Layout";

const Index = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { articles, articlesLoading } = useArticles();
  const [showReferralSignUp, setShowReferralSignUp] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isCryptoTickerEnabled, setIsCryptoTickerEnabled] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('ref');
    
    if (code) {
      console.log("Referral code detected:", code);
      setReferralCode(code);
      
      const checkReferralCode = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, email')
            .eq('referral_code', code)
            .maybeSingle();
            
          if (error) {
            console.error("Error checking referral code:", error);
            toast({
              title: "Invalid Referral Code",
              description: "The referral code in the URL is not valid.",
              variant: "destructive",
            });
            return;
          }
          
          if (!data) {
            console.log("No user found with this referral code");
            toast({
              title: "Invalid Referral Code",
              description: "The referral code in the URL is not valid.",
              variant: "destructive",
            });
            return;
          }
          
          console.log("Referral code is valid, belongs to user:", data.id);
          
          localStorage.setItem('pendingReferralCode', code);
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            setShowReferralSignUp(true);
          } else {
            toast({
              title: "You're Already Signed In",
              description: "Sign out first if you want to use a referral link to create a new account.",
            });
          }
        } catch (err) {
          console.error("Error processing referral code:", err);
        }
      };
      
      checkReferralCode();
    }

    if (location.state?.scrollToPresale) {
      const presaleSection = document.getElementById('presale');
      if (presaleSection) {
        presaleSection.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState({}, document.title);
      }
    } else if (location.hash === '#presale') {
      const presaleSection = document.getElementById('presale');
      if (presaleSection) {
        presaleSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    console.log("Index: Forcing refresh of ticker settings and banners");
    queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
    queryClient.invalidateQueries({ queryKey: ['ticker-settings'] });
    queryClient.invalidateQueries({ queryKey: ['ticker-text'] });
    
    setTimeout(() => {
      console.log("Index: Forcing another refresh after timeout");
      queryClient.invalidateQueries({ queryKey: ['ticker-settings'] });
      queryClient.invalidateQueries({ queryKey: ['ticker-text'] });
    }, 1000);
  }, [location, queryClient]);

  useEffect(() => {
    const fetchCryptoTickerState = async () => {
      try {
        console.log("Index: Fetching crypto ticker state");
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'crypto_ticker_enabled')
          .single();
        
        if (error) {
          console.error("Index: Error fetching crypto ticker state:", error);
          setIsCryptoTickerEnabled(false);
          return;
        }
        
        if (data) {
          console.log("Index: Raw crypto ticker enabled value:", data.value);
          const enabled = data.value === 'true';
          console.log("Index: Crypto ticker should be enabled:", enabled);
          setIsCryptoTickerEnabled(enabled);
        } else {
          console.log("Index: No crypto ticker state found, defaulting to false");
          setIsCryptoTickerEnabled(false);
        }
      } catch (err) {
        console.error("Index: Error fetching crypto ticker state:", err);
        setIsCryptoTickerEnabled(false);
      }
    };

    fetchCryptoTickerState();
    
    const tickerStateChannel = supabase
      .channel('crypto-ticker-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'site_settings',
        filter: 'key=eq.crypto_ticker_enabled'
      }, (payload) => {
        if (payload.new) {
          console.log("Index: Crypto ticker state changed:", payload.new);
          const enabled = (payload.new as any).value === 'true';
          console.log("Index: New crypto ticker state:", enabled);
          setIsCryptoTickerEnabled(enabled);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(tickerStateChannel);
    };
  }, []);

  const { data: heroBanners, isLoading: bannersLoading, error: bannersError } = useQuery({
    queryKey: ['hero-banners'],
    queryFn: async () => {
      console.log("Fetching hero banners");
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .eq('position', 'hero')
          .order('order', { ascending: true });
        
        if (error) {
          console.error("Error fetching banners:", error);
          throw error;
        }
        
        console.log("Banner data from database:", data);
        
        if (!data || data.length === 0) {
          console.log("No active banners found in database");
          return [];
        }
        
        return data.map((banner: Banner) => {
          console.log("Processing banner:", banner);
          
          if (!banner.image_url) {
            console.log(`Banner ${banner.id} has no image URL`);
            return banner;
          }
            
          if (banner.image_url.startsWith('http')) {
            console.log(`Banner ${banner.id} already has full URL:`, banner.image_url);
            return banner;
          }
          
          try {
            const { data: { publicUrl } } = supabase.storage
              .from('banners')
              .getPublicUrl(banner.image_url);
            
            console.log(`Banner ${banner.id} image URL converted:`, publicUrl);
            return { ...banner, image_url: publicUrl };
          } catch (error) {
            console.error(`Error processing banner ${banner.id} URL:`, error);
            return banner;
          }
        });
      } catch (err) {
        console.error("Failed to fetch banners:", err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 300000,
  });

  const { data: presaleContent } = useQuery({
    queryKey: ['home-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_id', 'home')
        .eq('section_id', 'main')
        .single();
      
      if (error) throw error;
      const content = data?.content as HomeContent;
      return content;
    },
  });

  const { data: universityContent } = useQuery({
    queryKey: ['university-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_id', 'home')
        .eq('section_id', 'university')
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching university content:", error);
        return null;
      }
      
      return data?.content as HomeContent;
    },
  });

  const { data: partnerLogos } = useQuery({
    queryKey: ['partnerLogos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_logos')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      return data?.map(logo => {
        if (logo.image_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('partner-logos')
            .getPublicUrl(logo.image_url);
          return { ...logo, image_url: publicUrl };
        }
        return logo;
      });
    },
  });

  const { data: tickerSettings, isLoading: tickerLoading } = useQuery({
    queryKey: ['ticker-settings'],
    queryFn: async () => {
      console.log("Index: Fetching ticker settings");
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['ticker_text', 'ticker_enabled']);
      
      if (error) {
        console.error("Index: Error fetching ticker settings:", error);
        throw error;
      }
      
      if (!settings || settings.length === 0) {
        console.log("Index: No ticker settings found, using defaults");
        return {
          text: "🚀 CLAB PRESALE NOW OPEN!",
          isEnabled: false
        };
      }
      
      const textSetting = settings.find(item => item.key === 'ticker_text');
      const enabledSetting = settings.find(item => item.key === 'ticker_enabled');
      
      console.log("Index: Ticker settings fetched:", settings);
      console.log("Index: Ticker text:", textSetting?.value);
      console.log("Index: Ticker enabled:", enabledSetting?.value);
      
      const isEnabled = enabledSetting?.value === 'true';
      const tickerText = (textSetting?.value && typeof textSetting.value === 'string') 
        ? textSetting.value 
        : "🚀 CLAB PRESALE NOW OPEN!";
      
      console.log("Index: Ticker enabled parsed:", isEnabled);
      console.log("Index: Final ticker text for render:", tickerText);
      
      return {
        text: tickerText,
        isEnabled: isEnabled
      };
    },
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const latestArticles = articles 
    ? articles
        .filter(article => article.status === 'published' && !article.is_featured)
        .slice(0, 6) 
    : [];

  const displayReferralCode = referralCode && referralCode.length > 10 
    ? `${referralCode.substring(0, 5)}...${referralCode.substring(referralCode.length - 5)}`
    : referralCode;

  useEffect(() => {
    if (bannersError) {
      console.error("Banner loading error:", bannersError);
      toast({
        title: "Error loading banners",
        description: "There was a problem loading banner images. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [bannersError]);

  useEffect(() => {
    if (heroBanners) {
      console.log("Final processed banners for render:", heroBanners);
    }
  }, [heroBanners]);

  useEffect(() => {
    if (tickerSettings) {
      console.log("Index: Current ticker settings for rendering:", tickerSettings);
      console.log("Index: Ticker should be visible?", tickerSettings.isEnabled);
      console.log("Index: Ticker text to display:", tickerSettings.text);
    }
  }, [tickerSettings]);

  console.log("Index: Rendering with tickerSettings:", tickerSettings);

  return (
    <Layout>
      <main className="flex-grow main-gradient">
        {bannersLoading ? (
          <div className="w-full h-[400px] flex items-center justify-center pt-[100px]">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
          </div>
        ) : bannersError ? (
          <div className="w-full h-[400px] flex items-center justify-center pt-[100px]">
            <div className="text-center p-8 max-w-md mx-auto">
              <p className="text-red-400 mb-2">Could not load banner images</p>
              <p className="text-sm text-gray-400">Please refresh the page or try again later.</p>
            </div>
          </div>
        ) : (
          <HeroBanner banners={heroBanners} testMode={false} />
        )}
        
        {tickerSettings?.isEnabled && (
          <NewsMarquee text={tickerSettings.text || "🚀 CLAB PRESALE NOW OPEN!"} />
        )}
        
        <PresaleSection content={presaleContent} />
        <DefiBanner />
        
        <PresalePromoStrip />
        
        <UniversitySection content={universityContent} />
        <PlatformHighlights content={presaleContent} />
        
        <NewsSection articles={latestArticles} isLoading={articlesLoading} />
        <PartnersSection logos={partnerLogos} />
      </main>
      
      <Dialog open={showReferralSignUp} onOpenChange={setShowReferralSignUp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create an Account</DialogTitle>
            <DialogDescription>
              Sign up now to earn 1,000 bonus points!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 px-3 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-100 dark:border-emerald-800">
              <p className="font-medium">You've been invited to join!</p>
              <p className="text-sm mt-1">Sign up now to get 1,000 bonus points.</p>
              {referralCode && (
                <p className="text-sm mt-1">Using referral code: <span className="font-mono font-bold">{displayReferralCode}</span></p>
              )}
            </div>
            <AuthForm 
              isLogin={false} 
              setIsLogin={() => {}} 
              extraData={{ referral_code: referralCode }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Index;
