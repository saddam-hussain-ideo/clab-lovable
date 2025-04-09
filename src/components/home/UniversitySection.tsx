import { HomeContent } from "@/lib/types/cms";
import { GraduationCap, Edit, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState, useEffect } from "react";
import { CommandLineEditor } from "@/components/admin/CommandLineEditor";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UniversitySectionProps {
  content?: HomeContent;
}

export const UniversitySection = ({ content }: UniversitySectionProps) => {
  const { isAdmin } = useRole();
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState<HomeContent | undefined>(content);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (content) {
      setLocalContent(content);
    } else if (!localContent && isAdmin) {
      fetchUniversityContent();
    }
  }, [content]);
  
  const fetchUniversityContent = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("page_content")
        .select("content")
        .eq("page_id", "home")
        .eq("section_id", "university")
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        setLocalContent(data.content as HomeContent);
      }
    } catch (err) {
      console.error("Error fetching university content:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const universityContent = localContent?.university || {
    title: "CLAB ACADEMY UTILITY",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies aliquam, est libero tincidunt quam, nec tincidunt magna dui vel nisi. Phasellus blandit sapien a magna sagittis, eget congue libero molestie. Vestibulum quis nibh sed magna pellentesque varius. Praesent aliquam, velit ac pulvinar convallis, eros nisi efficitur risus, non mollis est ipsum quis tortor. Sed lacinia ante vel justo dignissim, sed congue magna varius.",
    highlights: [
      "Access exclusive educational content",
      "Learn from crypto experts and veterans",
      "Earn while you learn with our token rewards system"
    ],
    ctaText: "Join CLAB University"
  };

  const handleSave = (updatedContent: any) => {
    console.log("Saving university section with updated content:", updatedContent);
    setLocalContent(updatedContent);
    setIsEditing(false);
    toast.success("The University section has been successfully updated");
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const generateRandomPriceData = () => {
    const points = [];
    let baseValue = 100;
    
    for (let i = 0; i < 20; i++) {
      const change = (Math.random() - 0.5) * 5;
      baseValue += change;
      
      if (baseValue < 50) baseValue = 50;
      if (baseValue > 150) baseValue = 150;
      
      points.push(baseValue);
    }
    
    return points;
  };

  const priceData = generateRandomPriceData();
  
  const trendUp = priceData[priceData.length - 1] > priceData[0];
  
  const minValue = Math.min(...priceData);
  const maxValue = Math.max(...priceData);
  const range = maxValue - minValue;

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-900 to-black overflow-hidden">
      <div className="container px-4 mx-auto relative">
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-2 right-2 p-2 bg-fuchsia-700/20 text-fuchsia-500 rounded-full hover:bg-fuchsia-700/40 transition-colors z-10"
            title="Edit University Section"
          >
            <Edit size={16} />
          </button>
        )}

        {isEditing ? (
          <div className="mb-8">
            <CommandLineEditor
              sectionId="university"
              pageId="home"
              initialContent={localContent || { university: universityContent }}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-fuchsia-900/30 text-fuchsia-400 text-sm font-medium">
                <GraduationCap className="w-4 h-4 mr-2" />
                Educational Platform
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {universityContent.title}
              </h2>
              
              <p className="text-gray-400 leading-relaxed">
                {universityContent.description}
              </p>
              
              <ul className="space-y-3">
                {universityContent.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1 mr-2 text-fuchsia-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-white">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative h-[400px] flex items-center justify-center">
              <div className="absolute w-[350px] h-[350px] bg-fuchsia-600/20 rounded-full animate-pulse"></div>
              <div className="relative z-10 w-[320px] h-[320px] flex items-center justify-center bg-gradient-to-br from-black/80 to-zinc-900/80 rounded-lg p-4 border border-fuchsia-500/30">
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center text-white font-bold">C</div>
                      <div className="ml-2">
                        <div className="text-white font-bold">FUTURES</div>
                        <div className="text-xs text-gray-400">University Token</div>
                      </div>
                    </div>
                    <div className={`flex items-center ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="text-lg font-bold">$247.58</span>
                      {trendUp ? <ArrowUpRight className="ml-1 w-4 h-4" /> : <ArrowDownRight className="ml-1 w-4 h-4" />}
                    </div>
                  </div>
                  
                  <div className="w-full h-32 relative mb-4 border-b border-l border-gray-700/50">
                    <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={trendUp ? "rgb(34, 197, 94, 0.2)" : "rgb(239, 68, 68, 0.2)"} />
                          <stop offset="100%" stopColor={trendUp ? "rgb(34, 197, 94, 0)" : "rgb(239, 68, 68, 0)"} />
                        </linearGradient>
                      </defs>
                    
                      <path 
                        d={`
                          M 0 ${50 - ((priceData[0] - minValue) / range) * 50}
                          ${priceData.map((point, i) => 
                            `L ${(i / (priceData.length - 1)) * 100} ${50 - ((point - minValue) / range) * 50}`
                          ).join(' ')}
                          L 100 50 L 0 50 Z
                        `}
                        fill="url(#chartGradient)"
                        className="transition-all duration-300 ease-in-out"
                      />
                      
                      <path 
                        d={`
                          M 0 ${50 - ((priceData[0] - minValue) / range) * 50}
                          ${priceData.map((point, i) => 
                            `L ${(i / (priceData.length - 1)) * 100} ${50 - ((point - minValue) / range) * 50}`
                          ).join(' ')}
                        `}
                        fill="none"
                        stroke={trendUp ? "#22c55e" : "#ef4444"}
                        strokeWidth="1.5"
                        strokeDasharray="200"
                        strokeDashoffset="200"
                        className="animate-drawLine"
                      />
                      
                      <circle 
                        cx="80" 
                        cy={50 - ((priceData[Math.floor(priceData.length * 0.8)] - minValue) / range) * 50} 
                        r="2" 
                        fill={trendUp ? "#22c55e" : "#ef4444"}
                        className="animate-pulse"
                      />
                    </svg>
                    
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 transform translate-y-4">
                      <span>1H</span>
                      <span>1D</span>
                      <span>1W</span>
                      <span className="text-fuchsia-400 font-semibold">1M</span>
                      <span>1Y</span>
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">Trade Volume (24h)</span>
                      <span className="text-xs text-white font-medium">$1.25M</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 animate-[width_3s_ease-in-out_infinite_alternate]"
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full mt-6">
                    <div className="flex flex-col items-center p-2 rounded bg-zinc-800/50">
                      <span className="text-xs text-gray-400">24h High</span>
                      <span className="text-sm text-green-400">$253.14</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded bg-zinc-800/50">
                      <span className="text-xs text-gray-400">24h Low</span>
                      <span className="text-sm text-red-400">$239.12</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-green-500/30 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
              <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-red-500/30 rounded-full animate-bounce" style={{ animationDuration: '2.3s' }}></div>
              <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-fuchsia-500/30 rounded-full animate-bounce" style={{ animationDuration: '3.7s' }}></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

<style>{`
  @keyframes drawLine {
    to {
      stroke-dashoffset: 0;
    }
  }
  
  .animate-drawLine {
    animation: drawLine 2s ease-out forwards;
  }
`}</style>
