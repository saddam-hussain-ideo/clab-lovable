
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useArticleQuery } from "@/hooks/articles/useArticleQuery";
import { ArticleContent } from "@/components/articles/ArticleContent";
import { AdBlock } from "@/components/articles/AdBlock";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";
import { QuizPromotionWidget } from "@/components/QuizPromotionWidget";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Helmet } from "react-helmet";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const Article = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: article, isLoading, error, isError } = useArticleQuery(slug);
  
  // Only fetch published articles for related content
  const { data: articles } = useQuery({
    queryKey: ['published-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published');
      
      if (error) throw error;
      return data;
    }
  });

  // Show error toast and redirect on article not found
  useEffect(() => {
    if (isError) {
      console.error('Article loading error:', error);
      toast({
        title: "Article not found",
        description: "Redirecting to blog page...",
        variant: "destructive",
      });
      
      const timer = setTimeout(() => {
        navigate('/blog');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isError, error, navigate]);

  const { data: ad } = useQuery({
    queryKey: ['active-ad'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'square')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
        <Navbar />
        <div className="pt-32 pb-16 px-4 text-center">
          <h2 className="text-2xl text-red-600">Article Not Found</h2>
          <p className="text-gray-400 mt-2">We couldn't find the article you're looking for.</p>
          <p className="text-gray-400 mt-1">Redirecting to blog page in 3 seconds...</p>
          <button 
            onClick={() => navigate('/blog')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
        <Navbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-3/4 mb-4" />
            <div className="h-4 bg-white/10 rounded w-1/4 mb-8" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-white/10 rounded w-full" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>{article.meta_title || article.title}</title>
        <meta name="description" content={article.meta_description || article.excerpt} />
        {article.meta_keywords && (
          <meta name="keywords" content={article.meta_keywords.join(", ")} />
        )}
        <meta property="og:title" content={article.meta_title || article.title} />
        <meta property="og:description" content={article.meta_description || article.excerpt} />
        {article.imageUrl && <meta property="og:image" content={article.imageUrl} />}
      </Helmet>

      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Card className="p-6 mb-8 bg-white/5 backdrop-blur-lg border border-white/10">
                <ArticleContent 
                  article={article} 
                  articles={articles || []}
                />
              </Card>
            </div>
            
            <div>
              <div className="lg:sticky lg:top-24 space-y-6">
                {ad && <AdBlock ad={ad} />}
                <QuizPromotionWidget />
                <LeaderboardWidget />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Article;
