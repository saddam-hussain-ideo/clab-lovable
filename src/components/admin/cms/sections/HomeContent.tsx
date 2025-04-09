
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange, DollarSign } from "lucide-react";
import { PageContent } from "@/lib/types/cms";
import { PageContentForm } from "../PageContentForm";

interface HomeContentProps {
  content: PageContent | undefined;
  formatDate: (date: string) => string;
}

export const HomeContent = ({ content, formatDate }: HomeContentProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Home Page Content
          <DollarSign className="ml-2 h-5 w-5 text-green-500" />
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4" />
          Last updated: {content?.updated_at ? formatDate(content.updated_at) : 'Never'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PageContentForm
          pageId="home"
          sectionId="main"
          initialContent={content?.content}
          template={{
            hero: {
              title: "Welcome to CLAB",
              subtitle: "Learn, Trade, Earn",
              ctaText: "Get Started"
            },
            productBoxes: [
              {
                title: "DEFI CARD",
                description: "Access the future of finance with our decentralized banking solution",
                icon: "credit-card",
                link: "/defi-card"
              },
              {
                title: "CLAB ACADEMY",
                description: "Learn, earn, and master crypto with expert-led courses",
                icon: "graduation-cap",
                link: "/university"
              },
              {
                title: "PRESALE",
                description: "Get early access to CLAB tokens before they moon",
                icon: "coins",
                link: "/#presale"
              }
            ],
            features: [
              {
                title: "Feature 1",
                description: "Description for feature 1"
              },
              {
                title: "Feature 2",
                description: "Description for feature 2"
              },
              {
                title: "Feature 3",
                description: "Description for feature 3"
              }
            ],
            about: {
              title: "About CLAB",
              description: "Description about CLAB platform",
              highlights: ["Highlight 1", "Highlight 2", "Highlight 3"]
            },
            presale: {
              title: "Crypto Like A Boss",
              description: "Get in early on the CLAB Pre-Sale and ape into the most boss-level token around—now on the SUI Network! CLAB is the native currency of the Crypto Like A Boss ecosystem, where you can flex your trivia skills, rack up bonus points on the leaderboard, and earn stacks of CLAB just for growing your crypto knowledge. Forget all the boring fundamentals—this is your shot to snag some tokens before everyone else FOMOs in. Jump on the CLAB rocket, secure your spot in the presale, and let's moon together like true degenerates!",
              highlights: [
                {
                  text: "Powered by SOL: Experience next-level speed and security on a chain that's ready for true degens."
                },
                {
                  text: "Pre-Sale FOMO: Grab your CLAB tokens early and ride the rocket before the herd piles in."
                },
                {
                  text: "Trivia to Earn: Smash quizzes, climb the leaderboard, and stack those sweet CLAB rewards."
                }
              ]
            },
            platformHighlights: [
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
            ],
            university: {
              title: "CLAB UNIVERSITY UTILITY",
              description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies aliquam, est libero tincidunt quam, nec tincidunt magna dui vel nisi. Phasellus blandit sapien a magna sagittis, eget congue libero molestie. Vestibulum quis nibh sed magna pellentesque varius.",
              highlights: [
                "Access exclusive educational content",
                "Learn from crypto experts and veterans",
                "Earn while you learn with our token rewards system"
              ],
              ctaText: "Join CLAB University"
            }
          }}
        />
      </CardContent>
    </Card>
  );
};
