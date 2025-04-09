
import { Card } from "@/components/ui/card";
import { useFavorites } from "@/hooks/useFavorites";
import { Link } from "react-router-dom";
import { Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession } from "@/lib/supabase";

export const FavoriteArticles = () => {
  const session = useSession();
  const { favoriteArticles, toggleFavorite, isLoading } = useFavorites();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-gray-400 mt-4">Loading your favorite articles...</p>
      </Card>
    );
  }
  
  if (!favoriteArticles || favoriteArticles.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-400">You haven't favorited any articles yet.</p>
        <div className="mt-4">
          <Link to="/blog" className="text-blue-500 hover:underline">
            Browse articles
          </Link>
        </div>
      </Card>
    );
  }
  
  const handleRemove = (articleId: number) => {
    setDeletingId(articleId);
    toggleFavorite({ articleId });
    setTimeout(() => setDeletingId(null), 800);
  };
  
  return (
    <div className="space-y-4">
      {favoriteArticles.map((article) => (
        <Card key={article.id} className="p-4 bg-white/5 backdrop-blur-lg border border-white/10 relative overflow-hidden">
          <div className="flex items-start gap-4">
            {article.imageUrl && (
              <div className="hidden sm:block h-20 w-24 flex-shrink-0">
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="h-full w-full object-cover rounded"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg truncate mb-1">
                {article.title}
              </h3>
              <div className="flex items-center text-xs text-gray-400 mb-2">
                <span>{article.author}</span>
                <span className="mx-2">•</span>
                <span>{new Date(article.date).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{article.category}</span>
              </div>
              <p className="text-gray-300 text-sm line-clamp-2">
                {article.excerpt}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <Link to={`/blog/${article.slug || article.id}`}>
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">View Article</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-500"
                onClick={() => handleRemove(article.id)}
                disabled={deletingId === article.id}
              >
                <Trash2 className={`h-4 w-4 ${deletingId === article.id ? 'animate-pulse' : ''}`} />
                <span className="sr-only">Remove from favorites</span>
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
