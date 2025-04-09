import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Article } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/articles/FavoriteButton";

interface ArticleGridProps {
  articles: Article[] | undefined;
  isLoading: boolean;
  getArticleUrl: (article: Article) => string;
  displayCount?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showReadMore?: boolean;
  hideReadMoreOnMobile?: boolean;
}

export const ArticleGrid = ({ 
  articles, 
  isLoading, 
  getArticleUrl,
  displayCount = 10,
  onLoadMore,
  hasMore = false,
  showReadMore = false,
  hideReadMoreOnMobile = false
}: ArticleGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
        {Array.from({ length: displayCount }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl overflow-hidden backdrop-blur-lg bg-white/5 border border-white/10">
            <Skeleton className="w-full h-48" />
            <div className="p-1.5 sm:p-4 md:p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-20 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center mt-16">
        <p className="text-gray-400">No articles found</p>
      </div>
    );
  }

  const publishedArticles = articles.filter(article => article.status === 'published');
  const visibleArticles = publishedArticles.slice(0, displayCount);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
        {visibleArticles.map((article) => (
          <article key={article.id} className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg backdrop-blur-lg bg-white/5 border border-white/10 relative">
            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton articleId={article.id} className="bg-black/40 hover:bg-black/60" />
            </div>
            <Link to={getArticleUrl(article)}>
              <img
                src={article.imageUrl || '/placeholder.svg'}
                alt={article.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                  console.log(`Image failed to load for article: ${article.id}`);
                }}
              />
            </Link>
            <div className="p-1.5 sm:p-4 md:p-6">
              <div className="flex justify-between items-center mb-2 md:mb-3">
                <span className="text-xs sm:text-sm text-white font-medium">{article.category}</span>
                <time className="text-xs sm:text-sm text-gray-400">
                  {format(new Date(article.date || (article.created_at ? article.created_at : new Date().toISOString())), 'MMM d, yyyy')}
                </time>
              </div>
              <Link to={getArticleUrl(article)} className="block">
                <h3 className="text-sm sm:text-base md:text-xl font-semibold mb-2 md:mb-3 text-white hover:text-gray-300 transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </Link>
              <p className="text-gray-300 mb-4 text-sm hidden md:block line-clamp-3">
                {article.excerpt}
              </p>
              <div className="flex justify-between items-center">
                {showReadMore && (
                  <Link 
                    to={getArticleUrl(article)} 
                    className={`${hideReadMoreOnMobile ? 'hidden sm:block' : 'block'}`}
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-emerald-500 text-emerald-500 hover:bg-emerald-950/20 hover:text-emerald-400 transition-colors"
                    >
                      <span className="mr-2">Read More</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <div className={`${showReadMore ? 'ml-auto' : ''}`}>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="p-1.5 h-auto border-emerald-500/80 text-emerald-500 hover:bg-emerald-950/20 hover:text-emerald-400"
                  >
                    <Link to={getArticleUrl(article)}>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {hasMore && publishedArticles.length > displayCount && (
        <div className="text-center mt-8">
          <Button 
            onClick={onLoadMore}
            variant="outline"
            size="lg"
            className="min-w-[200px] border-emerald-500 text-emerald-500 hover:bg-emerald-950/20 hover:text-emerald-400"
          >
            Load More Articles
          </Button>
        </div>
      )}
    </div>
  );
};
