
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticleGrid } from "@/components/blog/ArticleGrid";
import { Article } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface NewsSectionProps {
  articles: Article[] | undefined;
  isLoading: boolean;
}

export const NewsSection = ({ articles, isLoading }: NewsSectionProps) => {
  const isMobile = useIsMobile();
  
  // Filter to ensure only published articles are shown
  const publishedArticles = articles?.filter(article => article.status === 'published');
  
  // Safe URL generation function to avoid broken links
  const getArticleUrl = (article: Article) => {
    if (!article.slug && !article.id) {
      console.error('Article has no slug or id:', article);
      return '/blog';
    }
    
    const urlParam = article.slug 
      ? encodeURIComponent(article.slug.trim().toLowerCase()) 
      : article.id.toString();
    
    return `/blog/${urlParam}`;
  };
  
  const MobileArticleScroller = () => {
    if (!publishedArticles || publishedArticles.length === 0) return null;

    return (
      <div className="mt-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-4 pb-4">
            {publishedArticles.slice(0, 6).map((article) => (
              <Link 
                key={article.id} 
                to={getArticleUrl(article)}
                className="shrink-0 w-[300px]"
              >
                <div className="h-full glass-card rounded-xl overflow-hidden backdrop-blur-lg bg-white/5 border border-white/10 transition-all duration-300 hover:shadow-lg">
                  <img
                    src={article.imageUrl || '/placeholder.svg'}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white font-medium">{article.category}</span>
                      <time className="text-xs text-gray-400">
                        {format(new Date(article.date || (article.created_at ? article.created_at : new Date().toISOString())), 'MMM d, yyyy')}
                      </time>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-300 mb-3 text-sm line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex justify-end">
                      <ArrowRight className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  };
  
  return (
    <section className="py-16 px-2 sm:px-4 md:px-8">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold mb-3 text-center text-white">Boss News</h2>
        <p className="text-lg text-gray-400 text-center mb-8">
          Master the crypto game like a boss with our up-to-date news and analysis.
        </p>
        
        {isMobile ? (
          <MobileArticleScroller />
        ) : (
          <ArticleGrid 
            articles={publishedArticles}
            isLoading={isLoading}
            getArticleUrl={getArticleUrl}
            displayCount={6}
            showReadMore={false}
            hideReadMoreOnMobile={true}
          />
        )}

        <div className="text-center mt-12">
          <Link to="/blog">
            <Button variant="outline" size="lg" className="gap-2">
              MORE CRYPTO NEWS
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
