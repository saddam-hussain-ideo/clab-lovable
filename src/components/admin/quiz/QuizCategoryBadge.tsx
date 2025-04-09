
import { QuizCategory } from "@/lib/types/quiz";
import { Badge } from "@/components/ui/badge";

const categoryColors: Record<QuizCategory, { bg: string, text: string }> = {
  satoshi: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-300" },
  bitcoin_history: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-300" },
  ethereum_history: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-300" },
  altcoins: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-300" },
  defi: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-300" },
  web3: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-800 dark:text-indigo-300" },
  crypto_news: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-300" },
  crypto_personalities: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-800 dark:text-pink-300" },
  degenerates: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-300" }
};

const categoryLabels: Record<QuizCategory, string> = {
  satoshi: "Satoshi",
  bitcoin_history: "Bitcoin History",
  ethereum_history: "Ethereum History",
  altcoins: "Altcoins",
  defi: "DeFi",
  web3: "Web3",
  crypto_news: "Crypto News",
  crypto_personalities: "Crypto Personalities",
  degenerates: "Degenerates"
};

interface QuizCategoryBadgeProps {
  category: QuizCategory;
}

export const QuizCategoryBadge = ({ category }: QuizCategoryBadgeProps) => {
  const colors = categoryColors[category] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-300" };
  const label = categoryLabels[category] || category;
  
  return (
    <Badge variant="outline" className={`${colors.bg} ${colors.text} border-transparent`}>
      {label}
    </Badge>
  );
};
