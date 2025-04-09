
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { TokenomicsContent, TokenomicsSection } from "@/lib/types/cms";
import { Loader2, DollarSign, Users, ArrowUpRight, Percent } from "lucide-react";

// Default sections data in case no data is available
const DEFAULT_SECTIONS = [
  {
    name: "Marketing",
    value: 20,
    amount: "13.80B",
    tabContent: {
      purpose: "Promotions & Awareness: Building CLAB's community and brand.",
      details: [
        "Influencer outreach and social media campaigns",
        "Community-building initiatives",
        "Brand development and partnerships"
      ]
    }
  },
  {
    name: "Liquidity",
    value: 20,
    amount: "13.80B",
    tabContent: {
      purpose: "Ensuring trading liquidity and price stability.",
      details: [
        "DEX Liquidity: Paired with ETH for trading pools",
        "Reduces price volatility and slippage",
        "LP tokens will be locked to build trust"
      ]
    }
  },
  {
    name: "Quiz Rewards",
    value: 25,
    amount: "17.25B",
    tabContent: {
      purpose: "Rewarding users for participating in the CLAB Quiz ecosystem.",
      details: [
        "Users earn points by completing quizzes",
        "Points can be exchanged for CLAB at token launch",
        "3-month staking lock on redeemed tokens"
      ]
    }
  },
  {
    name: "Development",
    value: 15,
    amount: "10.35B",
    tabContent: {
      purpose: "Funding the continuous improvement of the platform.",
      details: [
        "Technical development and feature enhancements",
        "Security audits and infrastructure improvements",
        "Future roadmap implementation funding"
      ],
      ctaLink: {
        text: "View Full Development Roadmap",
        url: "/roadmap"
      }
    }
  }
];

interface TokenAllocationTabsProps {
  content?: TokenomicsContent;
}

export const TokenAllocationTabs = ({ content }: TokenAllocationTabsProps) => {
  // Log the content received for debugging
  console.log("TokenAllocationTabs received content:", content);
  
  // Use sections from CMS or fallback to default sections
  const sections: TokenomicsSection[] = content?.sections?.length 
    ? content.sections 
    : DEFAULT_SECTIONS;
    
  console.log("Tabs using sections:", sections);

  return (
    <Tabs defaultValue={sections[0]?.name.toLowerCase().replace(/\s+/g, '')} className="space-y-8">
      <TabsList className="w-full justify-start bg-black/40 text-white border border-white/20 overflow-x-auto flex-nowrap">
        {sections.map((section) => (
          <TabsTrigger 
            key={section.name.toLowerCase().replace(/\s+/g, '')}
            value={section.name.toLowerCase().replace(/\s+/g, '')}
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white min-w-max"
          >
            {section.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map((section) => (
        <TabsContent 
          key={section.name.toLowerCase().replace(/\s+/g, '')} 
          value={section.name.toLowerCase().replace(/\s+/g, '')}
          className="mt-8 space-y-4"
        >
          <Card className="bg-black/40 backdrop-blur-lg border-white/20 overflow-hidden">
            <CardHeader className="bg-black/60 border-b border-white/10">
              <CardTitle className="text-xl flex justify-between items-center text-white">
                <span className="flex items-center">
                  {renderSectionIcon(section.name)}
                  {section.name}
                </span>
                <span className="text-lg font-normal flex items-center space-x-2">
                  <span className="text-emerald-400">{section.amount}</span>
                  <span className="text-white/60">({section.value}%)</span>
                  <Percent className="h-4 w-4 text-white/60" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-200 pt-6">
              {section.tabContent && (
                <div className="space-y-4">
                  {section.tabContent.purpose && (
                    <p className="text-white/90">{section.tabContent.purpose}</p>
                  )}
                  {section.tabContent.details && section.tabContent.details.length > 0 && (
                    <ul className="list-disc pl-6 space-y-2 text-white/80">
                      {section.tabContent.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  )}
                  {section.tabContent.ctaLink && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <Link 
                        to={section.tabContent.ctaLink.url} 
                        className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center"
                      >
                        {section.tabContent.ctaLink.text} 
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};

const renderSectionIcon = (sectionName: string) => {
  const name = sectionName.toLowerCase();
  
  if (name.includes('marketing')) {
    return <Users className="h-5 w-5 mr-2 text-emerald-400" />;
  } else if (name.includes('liquidity')) {
    return <DollarSign className="h-5 w-5 mr-2 text-emerald-400" />;
  } else if (name.includes('development') || name.includes('dev')) {
    return <CodeIcon className="h-5 w-5 mr-2 text-emerald-400" />;
  } else if (name.includes('rewards') || name.includes('quiz')) {
    return <TrophyIcon className="h-5 w-5 mr-2 text-emerald-400" />;
  } else if (name.includes('team')) {
    return <UsersIcon className="h-5 w-5 mr-2 text-emerald-400" />;
  }
  
  // Default icon
  return <Percent className="h-5 w-5 mr-2 text-emerald-400" />;
};

// Helper components for icons
const CodeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
