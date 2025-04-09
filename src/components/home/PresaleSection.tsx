
import { Button } from "@/components/ui/button";
import { FileText, Map, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { TokenPresale } from "@/components/TokenPresale";
import { HomeContent } from "@/lib/types/cms";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { hideTopPrice } from "@/utils/hideTopPrice";
import { DocumentButton } from "@/components/DocumentButton";
import { PresaleCountdown } from "@/components/presale/PresaleCountdown";
import { useRole } from "@/hooks/useRole";
import { isValidEthereumAddress, isValidSolanaAddress } from "@/utils/wallet";
import { logDebug } from "@/utils/debugLogging";
import { useQuery } from "@tanstack/react-query";

interface PresaleSectionProps {
  content: HomeContent | undefined;
}

export const PresaleSection = ({
  content
}: PresaleSectionProps) => {
  const [animate, setAnimate] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownDate, setCountdownDate] = useState<string | null>(null);
  const [walletOverrides, setWalletOverrides] = useState<string[]>([]);
  const { isAdmin } = useRole();
  
  const { getPrice } = useCryptoPrices(['solana']);
  const solPrice = getPrice ? getPrice("solana") || 0 : 0;

  // Use React Query to fetch the current stage description
  const { data: currentStageDescription } = useQuery({
    queryKey: ['activeStageDescription'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('presale_stages')
          .select('description')
          .eq('is_active', true)
          .order('order_number', { ascending: true });
        
        if (error) {
          console.error("Error fetching active stages:", error);
          return null;
        }
        
        if (data && data.length > 0) {
          return data[0].description;
        }
        return null;
      } catch (error) {
        console.error("Error fetching stage description:", error);
        return null;
      }
    },
    staleTime: 60000, // Cache results for 1 minute
    refetchOnWindowFocus: false // Don't refetch on window focus
  });

  // Use React Query to fetch countdown settings
  const { data: countdownSettings } = useQuery({
    queryKey: ['countdownSettings'],
    queryFn: async () => {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['show_countdown', 'countdown_date', 'countdown_wallet_overrides']);
          
        if (settingsError) {
          console.error("Error fetching countdown settings:", settingsError);
          return null;
        }
        
        if (settingsData && settingsData.length > 0) {
          const showCountdownSetting = settingsData.find(s => s.key === 'show_countdown');
          const countdownDateSetting = settingsData.find(s => s.key === 'countdown_date');
          const walletOverridesSetting = settingsData.find(s => s.key === 'countdown_wallet_overrides');
          
          const walletAddresses = walletOverridesSetting?.value 
            ? walletOverridesSetting.value.split('\n').map((addr: string) => addr.trim()).filter((addr: string) => addr.length > 0)
            : [];
            
          return {
            showCountdown: showCountdownSetting?.value === 'true',
            countdownDate: countdownDateSetting?.value || null,
            walletOverrides: walletAddresses
          };
        }
        
        return null;
      } catch (error) {
        console.error("Error fetching countdown settings:", error);
        return null;
      }
    },
    staleTime: 60000, // Cache results for 1 minute
    refetchOnWindowFocus: false // Don't refetch on window focus
  });

  const isWalletInWhitelist = useCallback((walletAddress: string, whitelist: string[]): boolean => {
    const normalizedWalletAddress = walletAddress.toLowerCase();

    return whitelist.some(address => {
      if (isValidEthereumAddress(address)) {
        return normalizedWalletAddress.toLowerCase() === address.toLowerCase();
      }
      if (isValidSolanaAddress(address)) {
        return normalizedWalletAddress === address;
      }
      return normalizedWalletAddress === address;
    });
  }, []);

  // Calculate if countdown should be shown based on settings and wallet state
  useEffect(() => {
    if (countdownSettings) {
      const currentWallet = localStorage.getItem('walletAddress');
      const isWalletWhitelisted = currentWallet && isWalletInWhitelist(currentWallet, countdownSettings.walletOverrides);
      const shouldShowCountdown = countdownSettings.showCountdown && !isAdmin && !isWalletWhitelisted;
      
      setWalletOverrides(countdownSettings.walletOverrides);
      setShowCountdown(shouldShowCountdown);
      setCountdownDate(countdownSettings.countdownDate);
    }
  }, [countdownSettings, isAdmin, isWalletInWhitelist]);

  // Setup animation and hide top price once, without repeated interval
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 300);

    const container = document.querySelector('.presale-section-container');
    if (container) {
      container.classList.add('presale-widget-container');
    }

    hideTopPrice();

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Set up realtime listeners for settings changes
  useEffect(() => {
    const settingsChannel = supabase.channel('presale-settings-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'site_settings',
      filter: 'key=in.(show_countdown,countdown_date,countdown_wallet_overrides)'
    }, (payload: {
      new?: {
        key?: string;
        value?: string;
      };
    }) => {
      if (payload.new && payload.new.key === 'show_countdown') {
        const currentWallet = localStorage.getItem('walletAddress');
        const isWalletWhitelisted = currentWallet && isWalletInWhitelist(currentWallet, walletOverrides);
        const shouldShowCountdown = payload.new.value === 'true' && !isAdmin && !isWalletWhitelisted;
        setShowCountdown(shouldShowCountdown);
      } else if (payload.new && payload.new.key === 'countdown_date') {
        setCountdownDate(payload.new.value || null);
      } else if (payload.new && payload.new.key === 'countdown_wallet_overrides') {
        const newOverrides = payload.new.value ? payload.new.value.split('\n').map(addr => addr.trim()).filter(addr => addr.length > 0) : [];
        setWalletOverrides(newOverrides);
        const showCountdownSetting = localStorage.getItem('showCountdown') === 'true';
        const currentWallet = localStorage.getItem('walletAddress');
        const isWalletWhitelisted = currentWallet && isWalletInWhitelist(currentWallet, newOverrides);
        const shouldShowCountdown = showCountdownSetting && !isAdmin && !isWalletWhitelisted;
        setShowCountdown(shouldShowCountdown);
      }
    }).subscribe();

    const handleWalletChange = () => {
      const currentWallet = localStorage.getItem('walletAddress');
      const isWalletWhitelisted = currentWallet && isWalletInWhitelist(currentWallet, walletOverrides);
      const showCountdownSetting = localStorage.getItem('showCountdown') === 'true';
      const shouldShowCountdown = showCountdownSetting && !isAdmin && !isWalletWhitelisted;
      setShowCountdown(shouldShowCountdown);
    };

    window.addEventListener('walletChanged', handleWalletChange);

    return () => {
      supabase.removeChannel(settingsChannel);
      window.removeEventListener('walletChanged', handleWalletChange);
    };
  }, [isAdmin, walletOverrides, isWalletInWhitelist]);

  // Memoize the highlights to prevent re-creation on each render
  const highlights = useMemo(() => {
    return content?.presale?.highlights || [{
      text: "Powered by SOL: Experience next-level speed and security on a chain that's ready for true degens."
    }, {
      text: "Pre-Sale FOMO: Grab your CLAB tokens early and ride the rocket before the herd piles in."
    }, {
      text: "Trivia to Earn: Smash quizzes, climb the leaderboard, and stack those sweet CLAB rewards."
    }];
  }, [content?.presale?.highlights]);

  return <section id="presale" className="py-8 md:py-16 px-4 md:px-8 bg-[#0f1422] relative overflow-hidden presale-section-container">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-800/20 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="space-y-6 md:space-y-8 relative z-10">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 flex items-center leading-tight">
                Crypto Like A Boss
              </h2>
              <div className="h-1 w-32 bg-purple-600 rounded-full mb-6 md:mb-8"></div>
              
              <div className="text-gray-300 text-base md:text-lg relative border-l-4 border-purple-600 pl-6 py-1 my-6 md:my-8">
                {content?.presale?.description || currentStageDescription || "Get in early on the CLAB Pre-Sale and ape into the most boss-level token around—now on the SOL Network! CLAB is the native currency of the Crypto Like A Boss ecosystem, where you can flex your trivia skills, rack up bonus points on the leaderboard, and earn stacks of CLAB just for growing your crypto knowledge."}
              </div>
            </div>
            
            <div className="hidden md:block space-y-6">
              {highlights.map((highlight, index) => 
                <div key={index} className="flex items-start gap-4 group">
                  <div className="text-purple-500 font-bold text-2xl mt-1">→</div>
                  <div className="bg-[#171f33] p-5 rounded-md border border-[#2a324d] flex-1 shadow-md transition duration-300 hover:border-purple-600/40 hover:bg-[#192038]">
                    <p className="text-gray-200">{highlight.text}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 md:pt-6">
              <Link to="/tokenomics" className="col-span-1">
                <Button variant="outline" size="default" className="w-full gap-2 bg-[#1b2439] text-white border-purple-500/30 hover:bg-purple-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-purple-600/20">
                  <FileText className="h-4 w-4" />
                  <span>TOKENOMICS</span>
                </Button>
              </Link>
              <Link to="/roadmap" className="col-span-1">
                <Button variant="outline" size="default" className="w-full gap-2 bg-[#1b2439] text-white border-purple-500/30 hover:bg-purple-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-purple-600/20">
                  <Map className="h-4 w-4" />
                  <span>ROADMAP</span>
                </Button>
              </Link>
              <Link to="/how-to-buy" className="col-span-1 hidden md:block">
                <Button variant="outline" size="default" className="w-full gap-2 bg-[#1b2439] text-white border-purple-500/30 hover:bg-purple-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-purple-600/20">
                  <HelpCircle className="h-4 w-4" />
                  <span>HOW TO BUY</span>
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative z-10 flex flex-col space-y-4">
            <div className="border border-[#2a324d] rounded-xl overflow-hidden bg-[#171f33] shadow-xl mt-4 md:mt-12">
              <div className="p-4 md:p-6 border-b border-[#2a324d]">
                <h3 className="text-xl md:text-3xl font-bold text-white flex items-center text-left mx-0">
                  <img src="/lovable-uploads/e4dfdc24-d7ce-468c-b683-9c8183acc92d.png" alt="CLAB Logo" className="w-8 h-8 md:w-10 md:h-10 mr-2 md:mr-3" />
                  {showCountdown ? "Presale Starting Soon!" : "Presale Live!"}
                </h3>
                <p className="text-sm md:text-base text-gray-400 mt-2 text-left">
                  {showCountdown ? "Get ready for the CLAB token presale launch" : currentStageDescription || "Don't miss your chance to get CLAB early bird tokens Like A Boss"}
                </p>
              </div>
              <div className="p-4 md:p-6">
                {showCountdown && countdownDate ? <PresaleCountdown targetDate={countdownDate} /> : <TokenPresale />}
              </div>
            </div>
            
            <div className="document-button-container">
              <DocumentButton variant="secondary" size="default" className="w-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
