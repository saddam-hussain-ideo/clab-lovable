
import { Icon as LucideIcon, Trophy, Users, Newspaper } from "lucide-react";
import { HomeContent } from "@/lib/types/cms";
import { Card, CardContent } from "@/components/ui/card";

const iconMap: Record<string, typeof LucideIcon> = {
  trophy: Trophy,
  users: Users,
  newspaper: Newspaper,
};

interface PlatformHighlightsProps {
  content?: HomeContent;
}

export const PlatformHighlights = ({ content }: PlatformHighlightsProps) => {
  const highlights = content?.platformHighlights || [
    {
      title: "Trivia to Earn",
      description: "Test your crypto knowledge, climb the leaderboard, and earn CLAB tokens for your expertise.",
      icon: "trophy"
    },
    {
      title: "Community Power",
      description: "Join a thriving community of crypto enthusiasts sharing knowledge and strategies.",
      icon: "users"
    },
    {
      title: "Daily Updates",
      description: "Stay informed with the latest crypto news and market analysis from our expert team.",
      icon: "newspaper"
    }
  ];

  return (
    <section className="py-24 bg-[#0f1422] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-800/20 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="container px-2 sm:px-4 md:px-8 mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          Platform Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {highlights.map((highlight, index) => {
            const IconComponent = iconMap[highlight.icon] || Trophy;
            
            return (
              <Card key={index} className="bg-[#171f33] border-[#2a324d] hover:border-purple-600/40 transition-colors rounded-xl overflow-hidden shadow-lg transform hover:-translate-y-1 hover:shadow-purple-500/10 transition-all duration-300">
                <CardContent className="pt-6 px-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <IconComponent className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {highlight.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
