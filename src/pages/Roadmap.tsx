import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle, CheckCircle2, Clock, Rocket, Target, Edit2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RoadmapPhase } from "@/lib/types/cms";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { MilestoneEditDialog } from "@/components/admin/roadmap/MilestoneEditDialog";
import { Progress } from "@/components/ui/progress";

interface Milestone {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  icon: string;
}

const defaultPhases = [
  {
    id: "phase1",
    name: "Phase 1: Foundation",
    icon: null,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at purus ac ligula efficitur varius. Maecenas non lacinia lectus. Proin at nisi arcu. Sed egestas ligula eu magna vestibulum, id finibus massa accumsan.",
    htmlDescription: `
    <h4><strong>Presale Launch</strong></h4>
    <p>Get in early and secure your CLAB tokens at exclusive discount prices during our presale phase. This is your chance to become an early adopter and gain a head start on trading, staking, and participating in everything the Crypto Like A Boss ecosystem has to offer. By joining the presale, you'll help fuel future developments—from key platform upgrades to innovative rewards features—while positioning yourself to benefit from CLAB's long-term growth.</p>
    <br>
    <h4><strong>Building Our Community</strong></h4>
    <p>Behind every successful token is a thriving, engaged community. We're focused on fostering an environment where crypto enthusiasts, beginners, and seasoned traders alike can connect, learn, and collaborate. Through regular AMAs, quiz challenges, and interactive events, we'll encourage members to share insights, discuss new ideas, and celebrate milestones together. Our goal is to create a sustainable, knowledge-driven space that drives CLAB adoption and rewards the people who help shape its evolution.</p>`,
    status: "completed",
    items: [
      "Build core infrastructure", 
      "Establish community foundation", 
      "Initial token distribution"
    ]
  },
  {
    id: "phase2",
    name: "Phase 2: Growth",
    icon: null,
    description: "Organizational Strength & Game-Changing DeFi",
    htmlDescription: `<h4><strong>Organizational Strength & Game-Changing DeFi</strong></h4>
    <p>As we move into Stage 2, Crypto Like A Boss will strengthen its organizational structure by onboarding seasoned professionals and assembling specialized teams to manage different aspects of the project. This expansion allows us to extend outreach to high-profile partners, seeking strategic collaborations that amplify our ecosystem's reach and utility. Additionally, we'll introduce our first-ever physical DeFi product—a breakthrough innovation set to redefine how crypto merges with real-world usability. While we're keeping the details under wraps for now, rest assured that this game-changing development will shake up the space and further cement CLAB's position as a forward-thinking powerhouse in the blockchain industry.</p>`,
    status: "in-progress",
    items: [
      "Organizational expansion", 
      "Strategic partnerships", 
      "Physical DeFi product launch"
    ]
  },
  {
    id: "phase3",
    name: "Phase 3: Expansion",
    icon: null,
    description: "CLAB Academy & Platform Upgrades",
    htmlDescription: `<h4><strong>CLAB Academy & Platform Upgrades</strong></h4>
    <p>In Stage 3, Crypto Like A Boss focuses on CLAB Academy, an all-encompassing learning platform designed to upskill our community, from novices to veteran traders. By combining interactive tutorials, real-time market insights, and gamified quizzes, CLAB Academy will empower users to grow their crypto expertise while earning CLAB for active participation. Simultaneously, we're rolling out major platform upgrades to deliver a seamless user experience with full CLAB integration—from token staking and quiz rewards, to exclusive member features that leverage CLAB's growing utility. These advancements place CLAB at the forefront of innovation, giving every holder the tools and opportunities to truly trade like a boss.</p>`,
    status: "upcoming",
    items: [
      "CLAB Academy launch", 
      "Platform upgrades", 
      "Seamless token integration"
    ]
  },
  {
    id: "phase4",
    name: "Phase 4: Maturity",
    icon: null,
    description: "Presale Distribution, Exchange Listings & Future Growth",
    htmlDescription: `<h4><strong>Presale Distribution, Exchange Listings & Future Growth</strong></h4>
    <p>At this pivotal stage, we'll complete the distribution of presale tokens, ensuring our early supporters receive their allocations according to a fair and transparent schedule. Immediately following the presale, CLAB will target listings on both decentralized and centralized exchanges, broadening accessibility and introducing the token to a global audience. With momentum from these listings, we'll concentrate on scaling the platform, forming new partnerships, and exploring additional growth avenues that align with our vision for sustainable crypto utility. This phase cements Crypto Like A Boss as an ecosystem primed for continuous expansion, innovation, and user-driven value.</p>`,
    status: "upcoming",
    items: [
      "Presale token distribution", 
      "Exchange listings", 
      "Partnership expansion"
    ]
  }
];

const defaultMilestones = [
  { 
    title: "Token Launch", 
    description: "Successfully launched with a secure and accessible structure.",
    status: "completed" as const,
    icon: "CheckCircle2" 
  },
  { 
    title: "Community Growth", 
    description: "Expanded community across multiple platforms with engaged members.",
    status: "completed" as const,
    icon: "CheckCircle2" 
  },
  { 
    title: "Learning Platform", 
    description: "Launching comprehensive education resources and tools.",
    status: "in-progress" as const,
    icon: "Clock" 
  },
  { 
    title: "Global Expansion", 
    description: "Reaching new markets and supporting multiple languages.",
    status: "upcoming" as const,
    icon: "Rocket" 
  },
  { 
    title: "Enterprise Solutions", 
    description: "Developing advanced features for institutional users.",
    status: "upcoming" as const,
    icon: "Target" 
  }
];

const defaultVision = "Our strategic vision is to build a comprehensive ecosystem that empowers users through educational resources, innovative tools, and a supportive community. Through careful planning and execution across multiple phases, we aim to transform the landscape of crypto education and accessibility.";

const Roadmap = () => {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const { isAdmin } = useRole();
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [activePhase, setActivePhase] = useState<string>("");

  const { data: content, isLoading, refetch } = useQuery({
    queryKey: ['roadmap-content'],
    queryFn: async () => {
      console.log("Roadmap Page: Fetching roadmap data...");
      try {
        const { data, error } = await supabase
          .from('page_content')
          .select('*')
          .eq('page_id', 'roadmap')
          .eq('section_id', 'main')
          .maybeSingle();

        if (error) {
          console.error("Roadmap Page: Error fetching data:", error);
          setError(error);
          throw error;
        }
        
        console.log("Roadmap Page: Raw data returned:", data);
        return data;
      } catch (error) {
        console.error("Failed to fetch roadmap data:", error);
        setError(error instanceof Error ? error : new Error("Unknown error"));
        toast({
          title: "Error loading roadmap content",
          description: "Please refresh the page to try again",
          variant: "destructive",
        });
        throw error;
      }
    },
    retry: 2,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 300 * 1000, // 5 minutes (replacing cacheTime with gcTime)
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    console.log("Roadmap content:", content);
  }, [content]);

  useEffect(() => {
    const storedMilestones = content?.content?.milestones || [];
    
    if (storedMilestones.length > 0) {
      setLocalMilestones(storedMilestones);
    } else {
      setLocalMilestones(defaultMilestones);
    }
  }, [content]);

  const safeContent = content?.content || {};
  console.log("Safe content:", safeContent);

  const phases = (() => {
    const hasValidCmsPhases = (
      content?.content && 
      content.content.phases && 
      Array.isArray(content.content.phases) && 
      content.content.phases.length > 0
    );
    
    if (hasValidCmsPhases) {
      return content.content.phases.map((phase: RoadmapPhase, index: number) => ({
        id: phase.id || `phase${index + 1}`,
        name: phase.name || `Phase ${index + 1}`,
        icon: getPhaseIcon(phase.status || 'upcoming'),
        description: phase.description || '',
        htmlDescription: phase.htmlDescription || '',
        status: phase.status || 'upcoming',
        items: Array.isArray(phase.items) ? phase.items : [],
      }));
    } 
    
    return defaultPhases.map(phase => ({
      ...phase,
      icon: getPhaseIcon(phase.status)
    }));
  })();

  useEffect(() => {
    if (phases.length > 0 && !activePhase) {
      setActivePhase(phases[0].id);
    }
  }, [phases, activePhase]);

  const defaultPhaseId = activePhase || (phases && phases.length > 0 ? phases[0].id : "phase1");

  function getPhaseIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-emerald-400" />;
      case "in-progress":
        return <Clock className="h-6 w-6 text-amber-400" />;
      case "upcoming":
        return <Rocket className="h-6 w-6 text-blue-400" />;
      default:
        return <Target className="h-6 w-6 text-purple-400" />;
    }
  }

  function getMilestoneIcon(milestone: any) {
    if (!milestone) return <Target className="h-5 w-5 text-purple-400" />;
    
    const iconName = milestone.icon || (milestone.status === "completed" ? "CheckCircle2" : milestone.status === "in-progress" ? "Clock" : "Rocket");
    
    const getIconClass = () => {
      switch (milestone.status) {
        case "completed": return "text-emerald-400";
        case "in-progress": return "text-amber-400";
        case "upcoming": return "text-blue-400";
        default: return "text-purple-400";
      }
    };

    switch (iconName) {
      case "CheckCircle2": return <CheckCircle2 className={`h-5 w-5 ${getIconClass()}`} />;
      case "Clock": return <Clock className={`h-5 w-5 ${getIconClass()}`} />;
      case "Rocket": return <Rocket className={`h-5 w-5 ${getIconClass()}`} />;
      case "Target": return <Target className={`h-5 w-5 ${getIconClass()}`} />;
      default: return <CheckCircle2 className={`h-5 w-5 ${getIconClass()}`} />;
    }
  }

  function getMilestoneGradient(status: string) {
    switch (status) {
      case "completed": return "from-emerald-900/20 to-zinc-900";
      case "in-progress": return "from-amber-900/20 to-zinc-900";
      case "upcoming": return "from-blue-900/20 to-zinc-900";
      default: return "from-purple-900/20 to-zinc-900";
    }
  }

  function getMilestoneBorderColor(status: string) {
    switch (status) {
      case "completed": return "bg-emerald-500";
      case "in-progress": return "bg-amber-500";
      case "upcoming": return "bg-blue-500";
      default: return "bg-purple-500";
    }
  }

  function getMilestoneIconBg(status: string) {
    switch (status) {
      case "completed": return "bg-emerald-500/20";
      case "in-progress": return "bg-amber-500/20";
      case "upcoming": return "bg-blue-500/20";
      default: return "bg-purple-500/20";
    }
  }

  const handleEditMilestone = (milestone: Milestone, index: number) => {
    setEditingMilestone(milestone);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleSaveMilestone = (updatedMilestone: Milestone) => {
    const newMilestones = [...localMilestones];
    newMilestones[editingIndex] = updatedMilestone;
    setLocalMilestones(newMilestones);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      const updatedContent = {
        ...safeContent,
        milestones: localMilestones,
      };
      
      const { error } = await supabase
        .from('page_content')
        .update({ content: updatedContent })
        .eq('page_id', 'roadmap')
        .eq('section_id', 'main');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Changes Saved",
        description: "Your milestone changes have been saved successfully",
      });
      
      setHasChanges(false);
      refetch();
    } catch (error) {
      console.error("Error saving milestones:", error);
      toast({
        title: "Error Saving Changes",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error loading roadmap</AlertTitle>
            <AlertDescription>
              There was a problem loading the roadmap content. Please try refreshing the page.
              <button 
                onClick={() => refetch()} 
                className="underline ml-2 text-white"
              >
                Try Again
              </button>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black opacity-70"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black/60 to-black"></div>
          <img
            src="/lovable-uploads/a1488bdf-a31f-4171-b482-b3727db54c17.png"
            alt="Roadmap Background"
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-purple-300">
              CLAB Roadmap
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              {(content?.content?.vision || defaultVision)}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-black to-zinc-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative mb-12">
              <div className="h-2 bg-zinc-800 rounded-full">
                <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full w-[10%]"></div>
              </div>
              <div className="flex justify-between mt-2">
                <div className="text-purple-400 text-sm">Launch</div>
                <div className="text-purple-400 text-sm">Current Progress</div>
                <div className="text-gray-500 text-sm">Future Goals</div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-64 w-full rounded-md" />
              </div>
            ) : (
              <Tabs value={activePhase || phases[0]?.id} onValueChange={setActivePhase} className="mb-12">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 bg-zinc-800/50 p-1 rounded-lg mb-8">
                  {phases.map((phase, index) => (
                    <TabsTrigger 
                      key={phase.id || `phase-${index}`} 
                      value={phase.id || `phase-${index}`}
                      className="flex items-center gap-2 data-[state=active]:bg-purple-900/40"
                    >
                      {phase.icon}
                      <span className="hidden md:inline">{phase.name}</span>
                      <span className="md:hidden">{phase.name?.split(':')[0] || "Phase"}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
      
                {phases.map((phase, index) => (
                  <TabsContent key={phase.id || `phase-content-${index}`} value={phase.id || `phase-${index}`}>
                    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                      <CardContent className="p-6 md:p-8">
                        {(phase.htmlDescription || phase.description) ? (
                          <div className="prose prose-lg prose-invert max-w-none prose-headings:text-purple-300 prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-purple-200 mb-6">
                            <h2>{phase.name}</h2>
                            {phase.htmlDescription ? (
                              <div dangerouslySetInnerHTML={{ __html: phase.htmlDescription }} />
                            ) : (
                              <p>{phase.description}</p>
                            )}
                          </div>
                        ) : null}
                        
                        {Array.isArray(phase.items) && phase.items.length > 0 ? (
                          <div className="mt-4">
                            <h3 className="text-xl font-semibold mb-4 text-purple-300">Key Objectives</h3>
                            <ul className="space-y-2">
                              {phase.items.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-400" />
                Key Milestones
              </h2>
              
              {isAdmin && hasChanges && (
                <Button onClick={saveChanges} variant="success" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {localMilestones.map((milestone, index) => (
                <Card 
                  key={index}
                  className={`border-zinc-800 bg-gradient-to-br ${getMilestoneGradient(milestone.status || 'upcoming')} backdrop-blur-sm overflow-hidden relative`}
                >
                  <div className={`h-1 ${getMilestoneBorderColor(milestone.status || 'upcoming')} w-full`}></div>
                  <CardContent className="p-6">
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 bg-zinc-800/50 hover:bg-zinc-700/50"
                        onClick={() => handleEditMilestone(milestone, index)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`${getMilestoneIconBg(milestone.status || 'upcoming')} p-2 rounded-full`}>
                        {getMilestoneIcon(milestone)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{milestone.title}</h3>
                        <p className="text-gray-400 text-sm">{milestone.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden mb-12">
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-purple-400" />
                  Our Vision
                </h2>
                
                <div className="text-gray-300 space-y-4">
                  <p>
                    At CLAB, we're committed to building a comprehensive ecosystem that empowers users at every level 
                    of crypto expertise. Our roadmap outlines how we'll expand from a token-focused community into a 
                    full educational platform with real utility.
                  </p>
                  <p>
                    Through careful planning and community involvement, we're creating sustainable growth opportunities 
                    while delivering value to token holders and learners alike.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <MilestoneEditDialog 
        milestone={editingMilestone}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveMilestone}
        index={editingIndex}
      />
    </Layout>
  );
};

export default Roadmap;
