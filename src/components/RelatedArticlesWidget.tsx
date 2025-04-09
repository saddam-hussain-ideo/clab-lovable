
import { Link } from "react-router-dom";
import { Article } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface RelatedArticlesWidgetProps {
  currentArticleId: number;
  articles: Article[];
}

export const RelatedArticlesWidget = ({ currentArticleId, articles }: RelatedArticlesWidgetProps) => {
  // Safe URL generation to prevent broken links
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

  const getRandomArticles = () => {
    // Only include published articles and filter out the current one
    const otherArticles = articles.filter(
      article => article.id !== currentArticleId && article.status === "published"
    );
    
    if (otherArticles.length === 0) {
      return [];
    }
    
    const shuffled = [...otherArticles].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const relatedArticles = getRandomArticles();

  if (relatedArticles.length === 0) return null;

  return (
    <div className="my-8 p-6 bg-white/5 rounded-lg border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">Related Articles</h3>
      <div className="grid gap-4">
        {relatedArticles.map((article) => (
          <Card key={article.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <Link 
                to={getArticleUrl(article)}
                className="group flex items-start gap-4"
              >
                <img 
                  src={article.imageUrl || '/placeholder.svg'} 
                  alt={article.title}
                  className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1">
                  <h4 className="font-medium text-white group-hover:text-gray-300 transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {article.excerpt?.slice(0, 100) || ""}...
                  </p>
                  <div className="flex items-center gap-1 text-sm text-blue-400 mt-2 group-hover:text-blue-300 transition-colors">
                    Read more <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
