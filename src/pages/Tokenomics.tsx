import { useState, useEffect, useCallback } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Coins, Sparkles, PieChart, BarChart3, Users, Droplets, Trophy, Code2, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { fetchCmsContent } from "@/lib/supabase";
import { JoinPresaleDriver } from "@/components/tokenomics/JoinPresaleDriver";
import { getCurrentPresaleStage } from "@/utils/presale/solanaPresale";
import { TokenMetricsDisplay } from "@/components/tokenomics/TokenMetricsDisplay";
import { Button } from "@/components/ui/button";
import { Network } from "@/types/wallet-providers";

const DEFAULT_TOKEN_DISTRIBUTION = [{
  name: "Marketing",
  value: 20,
  amount: "53.60B",
  color: "#22c55e",
  description: "Allocated for marketing campaigns, promotions, and community growth initiatives.",
  details: ["Social media campaigns", "Influencer partnerships", "Community events", "Brand awareness"]
}, {
  name: "Liquidity",
  value: 20,
  amount: "53.60B",
  color: "#15803d",
  description: "Reserved for DEX liquidity pools to ensure trading stability and reduce volatility.",
  details: ["DEX liquidity paired with ETH", "Market making activities", "Price stability mechanisms", "Reducing price volatility"]
}, {
  name: "Quiz Rewards",
  value: 25,
  amount: "67.00B",
  color: "#059669",
  description: "Dedicated to rewarding users for participating in and completing quizzes on the platform.",
  details: ["Daily quiz completion rewards", "Streak bonuses", "Educational achievement tokens", "Community learning incentives"]
}, {
  name: "Development",
  value: 15,
  amount: "40.20B",
  color: "#10b981",
  description: "Funding for ongoing platform development, technical improvements, and new features.",
  details: ["Technical infrastructure", "New feature development", "UI/UX improvements", "Security upgrades"]
}, {
  name: "Team & Advisors",
  value: 10,
  amount: "26.80B",
  color: "#34d399",
  description: "Allocated to the founding team, employees, and advisors with vesting periods.",
  details: ["Founding team allocation", "Employee incentives", "Advisory board compensation", "Long-term vesting schedules"]
}, {
  name: "Strategic Partners",
  value: 10,
  amount: "26.80B",
  color: "#4ade80",
  description: "Reserved for strategic partnerships and ecosystem growth opportunities.",
  details: ["Integration partners", "Cross-platform collaborations", "Industry alliances", "Ecosystem development"]
}];

const DEFAULT_TOKEN_METRICS = {
  totalSupply: "268B CLAB",
  tokenType: "SPL Token",
  launchPrice: "$0.00025"
};

const DEFAULT_NARRATIVE_TEXT = `Listen up—I've been around the block since BTC was under a buck, and let me tell you, CLAB has a tokenomic model built for true believers in this space. There's no team allocation—meaning no cheap dumps or hidden agendas. It's a fair and sustainable launch with a burned liquidity pool, locked forever so nobody's messing with the liquidity. The funds raised pump straight into product development, marketing, and rewarding the loyal crew who stick around for the long haul.

CLAB allocates tokens in a way that serves its holders first: solid reserves for professional marketing, robust staking to reward long-term loyalty, future trading incentives for the hardcore degens, and an ever-growing community rewards pool. On top of that, we've locked in deep liquidity for high-volume trading—so you can move your bags without fear of slippage. Bottom line: If you're all about longevity, real utility, and a project that's got your back, CLAB is where you stack.`;

const Tokenomics = () => {
  const [animate, setAnimate] = useState(false);
  const [activeChartIndex, setActiveChartIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState("distribution");
  const [tokenDistribution, setTokenDistribution] = useState(DEFAULT_TOKEN_DISTRIBUTION);
  const [tokenMetrics, setTokenMetrics] = useState(DEFAULT_TOKEN_METRICS);
  const [narrativeText, setNarrativeText] = useState(DEFAULT_NARRATIVE_TEXT);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPresaleStage, setCurrentPresaleStage] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const fetchTokenomicsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);
      console.log("Fetching tokenomics data for frontend page...");
      
      const contentPromise = fetchCmsContent('tokenomics', 'tokenomics', DEFAULT_TOKEN_METRICS);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), 10000)
      );
      
      let content;
      try {
        content = await Promise.race([contentPromise, timeoutPromise]);
      } catch (error: any) {
        console.error("Error fetching tokenomics content:", error);
        throw new Error(`Couldn't load tokenomics data: ${error.message}`);
      }
      
      console.log("Fetched tokenomics content:", content);
      if (content) {
        if (content.totalSupply || content.tokenType) {
          setTokenMetrics({
            ...DEFAULT_TOKEN_METRICS,
            totalSupply: content.totalSupply || DEFAULT_TOKEN_METRICS.totalSupply,
            tokenType: content.tokenType || DEFAULT_TOKEN_METRICS.tokenType
          });
        }

        if (content.narrativeText) {
          setNarrativeText(content.narrativeText);
        }
        
        if (Array.isArray(content.sections) && content.sections.length > 0) {
          const mappedSections = content.sections.map((section, index) => {
            const defaultColor = ["#22c55e", "#15803d", "#059669", "#10b981", "#34d399", "#4ade80"][index % 6];
            return {
              name: section.name,
              value: section.value,
              amount: section.amount,
              color: defaultColor,
              description: section.tabContent?.purpose || `Allocated for ${section.name.toLowerCase()} purposes.`,
              details: Array.isArray(section.tabContent?.details) ? section.tabContent.details : ["Details coming soon"]
            };
          });
          setTokenDistribution(mappedSections);
        }
      } else {
        console.log("No tokenomics data found, using defaults");
      }

      try {
        const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';
        
        const { data: networkSettings } = await supabase
          .from("page_content")
          .select("content")
          .eq("page_id", "tokenomics")
          .eq("section_id", "presale_ui_settings")
          .maybeSingle();
          
        let activeNetwork = network as Network;
        if (networkSettings?.content?.active_network) {
          const networkValue = networkSettings.content.active_network;
          activeNetwork = (networkValue === 'mainnet' || networkValue === 'testnet') 
            ? networkValue as Network 
            : 'mainnet' as Network;
          
          console.log("Using active network from settings:", activeNetwork);
        }
        
        const stagePromise = getCurrentPresaleStage(activeNetwork);
        const stageTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Presale stage fetch timeout')), 8000)
        );
        
        const stageData = await Promise.race([stagePromise, stageTimeoutPromise]) as any;
        console.log("Current presale stage data:", stageData);
        setCurrentPresaleStage(stageData);
      } catch (stageError: any) {
        console.error("Error fetching current presale stage:", stageError);
      }
    } catch (error: any) {
      console.error("Error fetching tokenomics data:", error);
      setHasError(true);
      setErrorMessage(error.message || "We couldn't load the tokenomics data. Please try again later.");
      toast({
        title: "Error loading tokenomics data",
        description: error.message || "We couldn't load the tokenomics data. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchTokenomicsData();
    
    const handleRetry = () => {
      setRetryCount(prev => prev + 1);
      fetchTokenomicsData();
    };
    
    window.addEventListener('tokenMetricsRetry', handleRetry);
    
    const intervalId = setInterval(() => {
      console.log("Refreshing tokenomics data...");
      fetchTokenomicsData();
    }, 60000);
    
    return () => {
      window.removeEventListener('tokenMetricsRetry', handleRetry);
      clearInterval(intervalId);
    };
  }, [fetchTokenomicsData, retryCount]);

  const renderNarrativeText = (text: string) => {
    return text.split('\n\n').map((paragraph, index) => <p key={index} className="leading-relaxed mb-4">
        {paragraph}
      </p>);
  };

  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
  };

  if (hasError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gradient-to-b from-black to-zinc-900 pt-28 md:pt-36 pb-16">
          <div className="container mx-auto px-4 flex flex-col items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto">
              <div className="bg-red-900/30 p-6 rounded-lg border border-red-700/50 mb-6">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Unable to Load Tokenomics Data</h2>
                <p className="text-white/80 mb-4">
                  {errorMessage || "We're experiencing issues loading the tokenomics information. Please try again later."}
                </p>
                <Button 
                  onClick={handleRefresh} 
                  variant="destructive"
                  className="bg-red-700 hover:bg-red-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 pt-28 md:pt-36 pb-16">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl mb-4 md:mb-6 text-white animate-fade-in flex items-center justify-center text-left font-medium mx-0 md:text-4xl">
              <Sparkles className="h-8 w-8 text-emerald-400 mr-2" /> 
              CLAB Tokenomics
            </h1>
          </div>
          
          <p className="text-center text-white/80 max-w-2xl mx-auto mb-8 md:mb-12">
            The CLAB token powers our ecosystem, providing utility and governance. 
            Below is the detailed breakdown of token allocation and distribution strategy.
          </p>
          
          <TokenMetricsDisplay totalSupply={tokenMetrics.totalSupply} tokenType={tokenMetrics.tokenType} currentStage={currentPresaleStage} isLoading={isLoading} />
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8 md:space-y-12">
              <Tabs defaultValue="distribution" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="w-full justify-start bg-black/40 text-white border border-white/20">
                  <TabsTrigger value="distribution" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                    <PieChart className="h-4 w-4 mr-2" />
                    Distribution
                  </TabsTrigger>
                  <TabsTrigger value="utility" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Utility
                  </TabsTrigger>
                  <TabsTrigger value="vesting" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                    <Droplets className="h-4 w-4 mr-2" />
                    Vesting
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="distribution" className="space-y-8">
                  <div className="bg-black/20 p-4 md:p-6 rounded-lg border border-white/10">
                    <div className="mb-6 text-center">
                      <p className="text-xl md:text-2xl text-emerald-400 font-bold">
                        {tokenMetrics.totalSupply}
                      </p>
                      <p className="text-white/80 text-sm mt-2">Token Distribution</p>
                    </div>

                    <div className="h-[300px] md:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tokenDistribution} margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 60
                      }} onMouseLeave={() => setActiveChartIndex(-1)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} tick={{
                          fill: 'white',
                          fontSize: 10
                        }} tickMargin={5} />
                          <YAxis label={{
                          value: 'Allocation (%)',
                          angle: -90,
                          position: 'insideLeft',
                          fill: 'white',
                          fontSize: 12
                        }} tick={{
                          fill: 'white',
                          fontSize: 10
                        }} />
                          <Tooltip contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151'
                        }} labelStyle={{
                          color: 'white'
                        }} itemStyle={{
                          color: 'white'
                        }} formatter={(value: any) => [`${value}%`, 'Allocation']} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={animate ? 1500 : 0} animationBegin={0} onMouseEnter={(_, index) => setActiveChartIndex(index)}>
                            {tokenDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cursor="pointer" opacity={activeChartIndex === -1 || activeChartIndex === index ? 1 : 0.6} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="mb-10 p-6 bg-black/20 rounded-lg border border-white/10 text-white/90">
                    <div className="space-y-4">
                      {renderNarrativeText(narrativeText)}
                    </div>
                  </div>
                  
                  {tokenDistribution.length > 0 && <Tabs defaultValue={tokenDistribution[0].name.toLowerCase().replace(/\s+/g, '-')} className="space-y-8">
                      <TabsList className="w-full justify-start bg-black/40 text-white border border-white/20 overflow-x-auto flex-nowrap">
                        {tokenDistribution.map(section => <TabsTrigger key={section.name.toLowerCase().replace(/\s+/g, '-')} value={section.name.toLowerCase().replace(/\s+/g, '-')} className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white min-w-max">
                            {section.name}
                          </TabsTrigger>)}
                      </TabsList>

                      {tokenDistribution.map(section => {
                    let SectionIcon = Coins;
                    if (section.name.toLowerCase().includes('marketing')) {
                      SectionIcon = Users;
                    } else if (section.name.toLowerCase().includes('liquidity')) {
                      SectionIcon = Droplets;
                    } else if (section.name.toLowerCase().includes('development')) {
                      SectionIcon = Code2;
                    } else if (section.name.toLowerCase().includes('quiz') || section.name.toLowerCase().includes('reward')) {
                      SectionIcon = Trophy;
                    } else if (section.name.toLowerCase().includes('team') || section.name.toLowerCase().includes('advisor')) {
                      SectionIcon = Users;
                    } else if (section.name.toLowerCase().includes('strategic') || section.name.toLowerCase().includes('partner')) {
                      SectionIcon = ShieldCheck;
                    }
                    return <TabsContent key={section.name.toLowerCase().replace(/\s+/g, '-')} value={section.name.toLowerCase().replace(/\s+/g, '-')} className="mt-8 space-y-4">
                            <Card className="bg-black/40 backdrop-blur-lg border-white/20 overflow-hidden">
                              <div className="bg-black/60 border-b border-white/10 p-4">
                                <div className="text-xl flex justify-between items-center text-white">
                                  <span className="flex items-center">
                                    <SectionIcon className="h-5 w-5 mr-2 text-emerald-400" />
                                    {section.name}
                                  </span>
                                  <span className="text-lg font-normal flex items-center space-x-2">
                                    <span className="text-emerald-400">{section.amount}</span>
                                    <span className="text-white/60">({section.value}%)</span>
                                  </span>
                                </div>
                              </div>
                              <CardContent className="text-gray-200 pt-6">
                                <div className="space-y-4">
                                  <p className="text-white/90">{section.description}</p>
                                  <ul className="list-disc pl-6 space-y-2 text-white/80">
                                    {section.details.map((detail, index) => <li key={index}>{detail}</li>)}
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>;
                  })}
                    </Tabs>}
                </TabsContent>
                
                <TabsContent value="utility" className="space-y-8">
                  <div className="bg-black/20 p-4 md:p-6 rounded-lg border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-6">Token Utility</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-black/40 backdrop-blur-lg border-white/20">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="bg-emerald-500/10 p-3 rounded-lg">
                              <Trophy className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">Quiz Rewards</h3>
                              <p className="text-white/70">
                                Earn CLAB tokens by participating in daily quizzes and testing your 
                                cryptocurrency knowledge. Higher scores earn more tokens.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-black/40 backdrop-blur-lg border-white/20">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="bg-emerald-500/10 p-3 rounded-lg">
                              <Users className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">Membership Access</h3>
                              <p className="text-white/70">
                                Holding CLAB tokens grants exclusive access to premium features, 
                                content, and community channels.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-black/40 backdrop-blur-lg border-white/20">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="bg-emerald-500/10 p-3 rounded-lg">
                              <ShieldCheck className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">Governance</h3>
                              <p className="text-white/70">
                                CLAB token holders can vote on platform development decisions, 
                                feature prioritization, and governance proposals.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-black/40 backdrop-blur-lg border-white/20">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="bg-emerald-500/10 p-3 rounded-lg">
                              <Code2 className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">Platform Fee Discounts</h3>
                              <p className="text-white/70">
                                Pay reduced fees on platform services and transactions when using 
                                CLAB tokens for payment.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="vesting" className="space-y-8">
                  <div className="bg-black/20 p-4 md:p-6 rounded-lg border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-6">Token Release Schedule</h2>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-white/90">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="py-3 px-4 text-left">Allocation</th>
                            <th className="py-3 px-4 text-left">TGE Unlock</th>
                            <th className="py-3 px-4 text-left">Cliff</th>
                            <th className="py-3 px-4 text-left">Vesting Period</th>
                            <th className="py-3 px-4 text-left">Release Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/10">
                            <td className="py-3 px-4">Presale</td>
                            <td className="py-3 px-4">25%</td>
                            <td className="py-3 px-4">None</td>
                            <td className="py-3 px-4">6 months</td>
                            <td className="py-3 px-4">Monthly</td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-3 px-4">Team & Advisors</td>
                            <td className="py-3 px-4">0%</td>
                            <td className="py-3 px-4">6 months</td>
                            <td className="py-3 px-4">24 months</td>
                            <td className="py-3 px-4">Monthly</td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-3 px-4">Marketing</td>
                            <td className="py-3 px-4">10%</td>
                            <td className="py-3 px-4">None</td>
                            <td className="py-3 px-4">12 months</td>
                            <td className="py-3 px-4">Monthly</td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-3 px-4">Liquidity</td>
                            <td className="py-3 px-4">100%</td>
                            <td className="py-3 px-4">None</td>
                            <td className="py-3 px-4">N/A</td>
                            <td className="py-3 px-4">N/A</td>
                          </tr>
                          <tr className="border-b border-white/10">
                            <td className="py-3 px-4">Development</td>
                            <td className="py-3 px-4">5%</td>
                            <td className="py-3 px-4">3 months</td>
                            <td className="py-3 px-4">24 months</td>
                            <td className="py-3 px-4">Quarterly</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4">Strategic Partners</td>
                            <td className="py-3 px-4">5%</td>
                            <td className="py-3 px-4">3 months</td>
                            <td className="py-3 px-4">18 months</td>
                            <td className="py-3 px-4">Quarterly</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-8 bg-black/30 p-4 rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-2">Note on Vesting</h3>
                      <p className="text-white/70">
                        Vesting schedules are designed to ensure long-term project sustainability and 
                        prevent market volatility. TGE (Token Generation Event) refers to the initial 
                        token launch date. The CLAB token distribution strategy prioritizes long-term 
                        growth and stability over short-term gains.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:mt-0 lg:sticky lg:top-24 h-fit">
              <JoinPresaleDriver />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
};

export default Tokenomics;
