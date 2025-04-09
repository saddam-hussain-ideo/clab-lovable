
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizCategory } from "@/lib/types/quiz";
import { BookOpen, Rocket, Bitcoin, LineChart, Code, Newspaper, Users, Bomb } from "lucide-react";

interface CategorySelectorProps {
  onSelectCategory: (category: QuizCategory) => void;
}

type CategoryOption = {
  id: QuizCategory;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

export const CategorySelector = ({ onSelectCategory }: CategorySelectorProps) => {
  const categories: CategoryOption[] = [
    {
      id: 'satoshi',
      name: 'Satoshi & Origins',
      description: "Test your knowledge about Bitcoin's creator and early history",
      icon: <Bitcoin className="h-6 w-6" />,
      color: 'from-orange-500 to-yellow-500'
    },
    {
      id: 'bitcoin_history',
      name: 'Bitcoin History',
      description: "Questions about Bitcoin's journey and key milestones",
      icon: <BookOpen className="h-6 w-6" />,
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'ethereum_history',
      name: 'Ethereum History',
      description: "Learn about Ethereum's development and major updates",
      icon: <Rocket className="h-6 w-6" />,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'altcoins',
      name: 'Altcoins',
      description: 'Test your knowledge about various alternative cryptocurrencies',
      icon: <LineChart className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'defi',
      name: 'DeFi',
      description: 'Questions about decentralized finance protocols and concepts',
      icon: <Code className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'web3',
      name: 'Web3',
      description: 'Test your knowledge of web3 technologies and applications',
      icon: <Code className="h-6 w-6" />,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'crypto_news',
      name: 'Crypto News',
      description: 'Stay updated with recent developments in the crypto world',
      icon: <Newspaper className="h-6 w-6" />,
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'crypto_personalities',
      name: 'Crypto Personalities',
      description: 'Questions about influential figures in the crypto space',
      icon: <Users className="h-6 w-6" />,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'degenerates',
      name: 'Degen Knowledge',
      description: 'Test your knowledge of memecoins and crypto culture',
      icon: <Bomb className="h-6 w-6" />,
      color: 'from-pink-500 to-rose-500'
    }
  ];

  // Added console.log to check if this component is rendering
  console.log("CategorySelector rendering with", categories.length, "categories");

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Select a Category</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id} 
            className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border border-zinc-800 hover:border-primary/50"
            onClick={() => {
              console.log("Selected category:", category.id);
              onSelectCategory(category.id);
            }}
          >
            <div className={`h-2 bg-gradient-to-r ${category.color}`} />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-gradient-to-br ${category.color} text-white`}>
                  {category.icon}
                </div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{category.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto">
                Select
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
