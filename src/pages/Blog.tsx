
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Article } from "@/lib/types";
import { Footer } from "@/components/Footer";
import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";
import { AdBlock } from "@/components/articles/AdBlock";
import { BlogBanner } from "@/components/blog/BlogBanner";
import { ArticleGrid } from "@/components/blog/ArticleGrid";
import { useBlogData } from "@/hooks/blog/useBlogData";
import { CategoryFilter } from "@/components/blog/CategoryFilter";
import { HorizontalAdBanner } from "@/components/articles/HorizontalAdBanner";
import { BlogHeaderBanner } from "@/components/articles/BlogHeaderBanner";

const Blog = () => {
  const [displayCount, setDisplayCount] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const {
    articles,
    articlesLoading,
    error,
    activeBanner,
    primaryAd,
    horizontalAd,
    categories,
  } = useBlogData();

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

  const handleLoadMore = () => {
    setDisplayCount(prevCount => prevCount + 12);
  };

  if (error) {
    console.error('Error loading articles:', error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
        <Navbar />
        <div className="pt-32 pb-16 px-8">
          <h2 className="text-2xl text-red-600">Error loading articles</h2>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  const filteredArticles = selectedCategory 
    ? articles?.filter(article => article.category === selectedCategory)
    : articles;

  const hasMore = filteredArticles ? filteredArticles.length > displayCount : false;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
        <div className="pt-24 w-full">
          <BlogHeaderBanner />
        </div>
        
        <BlogBanner banner={activeBanner} />
        
        <div className="mt-4 mb-2 mx-auto px-4">
          <HorizontalAdBanner ad={horizontalAd} />
        </div>
        
        <section className="pt-12 pb-16 px-8">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <CategoryFilter 
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
                
                <ArticleGrid 
                  articles={filteredArticles}
                  isLoading={articlesLoading}
                  getArticleUrl={getArticleUrl}
                  displayCount={displayCount}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                />
              </div>
              
              <div className="lg:sticky lg:top-24 lg:h-fit space-y-8">
                <AdBlock ad={primaryAd} className="mb-8" />
                <LeaderboardWidget className="mt-24" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
