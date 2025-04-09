import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Loader2, Clock, Check, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, isAfter, differenceInSeconds } from "date-fns";
import { getActiveNetwork } from "@/utils/wallet";
import { Spinner } from "@/components/ui/spinner";
import { logDebug } from "@/utils/debugLogging";

interface PresaleStage {
  id: string;
  name: string;
  description?: string;
  price: number;
  token_price: number;
  token_price_usd?: number;
  tokens_allocated: number;
  tokens_sold: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_published: boolean;
  network: string;
  order_number?: number;
  target_amount?: number;
}

export const PresaleStagesWidget = () => {
  const [stages, setStages] = useState<PresaleStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNetwork, setCurrentNetwork] = useState<'mainnet' | 'testnet'>(getActiveNetwork());
  const [allowNetworkToggle, setAllowNetworkToggle] = useState(false);
  const [countdown, setCountdown] = useState<string>('');
  const [countdownTarget, setCountdownTarget] = useState<string>('');
  const { toast } = useToast();
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);

  useEffect(() => {
    const handleNetworkChange = () => {
      const network = getActiveNetwork();
      console.log("PresaleStagesWidget: Network changed to:", network);
      setCurrentNetwork(network);
    };

    window.addEventListener('presaleNetworkChanged', handleNetworkChange);
    
    return () => {
      window.removeEventListener('presaleNetworkChanged', handleNetworkChange);
    };
  }, []);

  useEffect(() => {
    const fetchUISettings = async () => {
      try {
        const { data, error } = await supabase
          .from("page_content")
          .select("content")
          .eq("page_id", "tokenomics")
          .eq("section_id", "presale_ui_settings")
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching presale UI settings:", error);
          return;
        }
        
        if (data?.content) {
          console.log("PresaleStagesWidget: UI settings loaded:", data.content);
          setAllowNetworkToggle(data.content.show_network_toggle || false);
          
          if (data.content.active_network && !allowNetworkToggle) {
            console.log(`PresaleStagesWidget: Setting network from admin setting to: ${data.content.active_network}`);
            setCurrentNetwork(data.content.active_network);
            
            try {
              localStorage.setItem('activeNetwork', data.content.active_network);
              const event = new Event('presaleNetworkChanged');
              window.dispatchEvent(event);
            } catch (err) {
              console.error("Error updating localStorage:", err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch presale UI settings:", err);
      }
    };
    
    fetchUISettings();
  }, [allowNetworkToggle]);

  useEffect(() => {
    const fetchPresaleStages = async () => {
      try {
        setIsLoading(true);
        setDataFetchError(null);
        
        const networkFilter = currentNetwork === 'testnet' ? 'testnet' : 'mainnet';
        logDebug('PRESALE_STAGES', `Fetching presale stages for network: ${networkFilter}`);
        console.log(`PresaleStagesWidget: Fetching presale stages for network: ${networkFilter}`);
        
        const { data, error } = await supabase
          .from("presale_stages")
          .select("*")
          .eq("network", networkFilter)
          .eq("is_published", true)
          .order("order_number", { ascending: true });
        
        if (error) {
          console.error("PresaleStagesWidget: Error fetching presale stages:", error);
          setDataFetchError("Failed to load presale data");
          throw error;
        }
        
        if (data) {
          logDebug('PRESALE_STAGES', `Fetched ${data.length} presale stages for ${networkFilter}`);
          console.log(`PresaleStagesWidget: Fetched ${data.length} presale stages for ${networkFilter}:`, data);
          
          const processedStages = data.map(stage => ({
            ...stage,
            tokens_allocated: stage.tokens_allocated || stage.allocation_amount || 0,
            tokens_sold: stage.tokens_sold || 0
          }));
          
          setStages(processedStages);
          console.log("Processed stages:", processedStages);
        } else {
          console.log(`PresaleStagesWidget: No presale stages found for ${networkFilter}`);
          setStages([]);
        }
      } catch (error) {
        console.error("PresaleStagesWidget: Error fetching presale stages:", error);
        setDataFetchError("Failed to load presale data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPresaleStages();
    
    const intervalId = setInterval(() => {
      console.log("PresaleStagesWidget: Refreshing presale stages data");
      fetchPresaleStages();
    }, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [toast, currentNetwork]);

  useEffect(() => {
    if (stages.length === 0) return;

    const activeStages = stages.filter(stage => stage.is_active)
      .sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
    
    const activeStage = activeStages.length > 0 ? activeStages[0] : null;
    const now = new Date();

    if (activeStage && activeStage.end_date) {
      const endDate = new Date(activeStage.end_date);
      
      if (isAfter(endDate, now)) {
        setCountdownTarget(`${activeStage.name} ends in`);
        updateCountdown(endDate);
      } else {
        findNextStage();
      }
    } else {
      findNextStage();
    }

    function findNextStage() {
      const upcomingStages = stages.filter(stage => 
        stage.start_date && isAfter(new Date(stage.start_date), now)
      ).sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

      if (upcomingStages.length > 0) {
        const nextStage = upcomingStages[0];
        const startDate = new Date(nextStage.start_date);
        setCountdownTarget(`${nextStage.name} starts in`);
        updateCountdown(startDate);
      } else {
        setCountdown('');
        setCountdownTarget('');
      }
    }

    function updateCountdown(targetDate: Date) {
      const timer = setInterval(() => {
        const now = new Date();
        const diffInSeconds = differenceInSeconds(targetDate, now);
        
        if (diffInSeconds <= 0) {
          clearInterval(timer);
          setCountdown('00:00:00');
          const fetchStages = async () => {
            const networkFilter = currentNetwork === 'testnet' ? 'testnet' : 'mainnet';
            const { data } = await supabase
              .from("presale_stages")
              .select("*")
              .eq("network", networkFilter)
              .order("start_date", { ascending: true });
            
            if (data) {
              const processedStages = data.map(stage => ({
                ...stage,
                tokens_allocated: stage.tokens_allocated || stage.allocation_amount || 0,
                tokens_sold: stage.tokens_sold || 0
              }));
              
              setStages(processedStages);
            }
          };
          fetchStages();
          return;
        }
        
        const days = Math.floor(diffInSeconds / 86400);
        const hours = Math.floor((diffInSeconds % 86400) / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;
        
        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [stages, currentNetwork]);

  const handleNetworkToggle = () => {
    const newNetwork = currentNetwork === 'mainnet' ? 'testnet' : 'mainnet';
    console.log(`PresaleStagesWidget: Manually toggling network to ${newNetwork}`);
    setCurrentNetwork(newNetwork);
    
    localStorage.setItem('activeNetwork', newNetwork);
    
    const event = new Event('presaleNetworkChanged');
    window.dispatchEvent(event);
  };

  const getStageStatus = (stage: PresaleStage) => {
    const now = new Date();
    const startDate = new Date(stage.start_date);
    
    if (stage.is_active) {
      return { status: "active", label: "ACTIVE NOW", color: "bg-emerald-500" };
    }
    
    if (stage.tokens_allocated > 0 && stage.tokens_sold >= stage.tokens_allocated) {
      return { status: "completed", label: "SOLD OUT", color: "bg-purple-500" };
    }
    
    if (stage.end_date && new Date(stage.end_date) < now) {
      return { status: "ended", label: "ENDED", color: "bg-gray-500" };
    }
    
    if (startDate > now) {
      return { 
        status: "upcoming", 
        label: `STARTS IN ${formatDistanceToNow(startDate, { addSuffix: false })}`, 
        color: "bg-yellow-500" 
      };
    }
    
    return { status: "unknown", label: "COMING SOON", color: "bg-gray-500" };
  };

  const calculateProgress = (stage: PresaleStage) => {
    if (stage.target_amount && stage.target_amount > 0) {
      return Math.min(100, ((stage.tokens_sold || 0) / (stage.target_amount || 1)) * 100);
    } else if (stage.tokens_allocated && stage.tokens_allocated > 0) {
      return Math.min(100, ((stage.tokens_sold || 0) / stage.tokens_allocated) * 100);
    }
    return 0;
  };

  const getStagePrice = (stage: PresaleStage): number => {
    if (stage.token_price_usd) return stage.token_price_usd;
    return stage.token_price || stage.price || 0;
  };

  const formatTokenAmount = (amount: number): string => {
    if (!amount && amount !== 0) return "0";
    
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`;
    } else {
      return amount.toFixed(0);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-black/40 backdrop-blur-lg border border-fuchsia-500/30 h-full">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-lg font-bold text-white">Presale Stages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <Spinner className="h-8 w-8 text-fuchsia-500" />
          <p className="text-white/70 text-sm">Loading presale data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 backdrop-blur-lg border border-fuchsia-500/30 h-full">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-bold text-white">Presale Stages</span>
          {allowNetworkToggle ? (
            <div className="flex items-center gap-2">
              <span className={currentNetwork === 'testnet' ? 'text-xs text-gray-400' : 'text-xs font-medium text-white'}>
                MAINNET
              </span>
              <Switch 
                checked={currentNetwork === 'testnet'} 
                onCheckedChange={handleNetworkToggle}
              />
              <span className={currentNetwork === 'mainnet' ? 'text-xs text-gray-400' : 'text-xs font-medium text-white'}>
                TESTNET
              </span>
            </div>
          ) : (
            <Badge className="bg-gray-700 text-white text-xs">
              {currentNetwork === 'testnet' ? 'TESTNET' : 'MAINNET'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 py-1">
        {countdown && countdownTarget && (
          <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-black/50 border border-fuchsia-500/20">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-fuchsia-400" />
              <span className="text-xs text-fuchsia-300">{countdownTarget}</span>
            </div>
            <div className="text-sm font-mono text-white font-medium">
              {countdown}
            </div>
          </div>
        )}

        {dataFetchError ? (
          <div className="text-center py-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-white/70 text-sm">{dataFetchError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Reload page
            </button>
          </div>
        ) : stages.length === 0 ? (
          <div className="text-center py-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-white/70 text-sm">No presale stages available for {currentNetwork} network.</p>
          </div>
        ) : (
          stages.map((stage) => {
            const status = getStageStatus(stage);
            const progress = calculateProgress(stage);
            const price = getStagePrice(stage);
            return (
              <div key={stage.id} className="p-1.5 rounded-lg border border-white/10 bg-black/30">
                <div className="flex justify-between items-center mb-0.5">
                  <div className="font-medium text-xs text-white">
                    {stage.name}
                    <span className="ml-1 text-white/60 text-xs">
                      (Stage {stage.order_number || '-'})
                    </span>
                  </div>
                  <Badge className={`${status.color} text-white text-[10px] py-0 px-1.5 h-4 flex items-center`}>
                    {status.status === "active" ? (
                      <Clock className="h-2 w-2 mr-0.5 animate-pulse" />
                    ) : status.status === "completed" ? (
                      <Check className="h-2 w-2 mr-0.5" />
                    ) : null}
                    {status.label}
                  </Badge>
                </div>
                
                {stage.description && (
                  <div 
                    className="text-[11px] text-white/80 mb-1.5 leading-tight"
                    dangerouslySetInnerHTML={{ __html: stage.description }}
                  />
                )}
                
                <div className="mb-0.5">
                  <div className="flex justify-between text-[10px] text-white/70 mb-0.5">
                    <span>Price: ${price.toFixed(6)}</span>
                    <span>{progress?.toFixed(0) || "0"}% Filled</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-1 bg-white/10"
                    indicatorClassName={status.status === "active" ? "bg-emerald-500" : "bg-fuchsia-500"}
                  />
                </div>
                
                <div className="flex justify-between text-[9px] text-white/50">
                  <span>
                    {status.status === "upcoming" ? 
                      `Starts: ${new Date(stage.start_date).toLocaleDateString()}` : 
                      status.status === "ended" || status.status === "completed" ? 
                      "Completed" : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
        
        <div className="text-xs text-white/60 pt-1">
          <p className="text-[10px] leading-tight">Join our presale to get CLAB tokens at the best available price. Each stage has a limited allocation and price increases with each new stage.</p>
        </div>
      </CardContent>
    </Card>
  );
};
