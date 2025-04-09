
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Article } from "@/lib/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryListProps {
  categories: string[];
  articles: Article[];
  getArticleUrl: (article: Article) => string;
}

export const CategoryList = ({ categories, articles, getArticleUrl }: CategoryListProps) => {
  // Filter to ensure only published articles are shown
  const publishedArticles = articles.filter(article => article.status === 'published');
  
  return (
    <div className="relative mb-12">
      <Carousel 
        opts={{
          align: "start",
          loop: true
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {categories.map((category) => (
            <CarouselItem key={category} className="pl-4 md:basis-1/2">
              <div className="glass-card rounded-xl overflow-hidden backdrop-blur-lg bg-white/5 border border-white/10 p-4 h-full">
                <h3 className="text-xl font-semibold mb-4 text-white">{category}</h3>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {publishedArticles
                      .filter(article => article.category === category)
                      .map(article => (
                        <Link
                          key={article.id}
                          to={getArticleUrl(article)}
                          className="block p-2 rounded hover:bg-white/10 transition-colors"
                        >
                          <p className="text-sm text-white font-medium">{article.title}</p>
                          <span className="text-xs text-gray-400">
                            {format(new Date(article.date), 'MMM d, yyyy')}
                          </span>
                        </Link>
                      ))
                    }
                  </div>
                </ScrollArea>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 bg-white/10 hover:bg-white/20" />
        <CarouselNext className="right-0 bg-white/10 hover:bg-white/20" />
      </Carousel>
    </div>
  );
};
