
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Article } from "@/lib/types";
import { useSession } from "@/lib/supabase";

export const useFavorites = () => {
  const session = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  // Getting wallet address without relying on profile creation
  const getWalletAddress = () => {
    return localStorage.getItem('walletAddress') || null;
  };

  const { data: favoriteArticles, isLoading } = useQuery({
    queryKey: ['favorites', userId, getWalletAddress()],
    queryFn: async () => {
      if (!userId) {
        const walletAddress = getWalletAddress();
        if (!walletAddress) return [];
        
        // For temporary wallet addresses, just use local storage
        const localFavoritesKey = `wallet_favorites_${walletAddress}`;
        const localFavorites = localStorage.getItem(localFavoritesKey);
        
        if (localFavorites) {
          try {
            const parsedFavorites = JSON.parse(localFavorites);
            console.log("Using locally stored favorites:", parsedFavorites);
            return parsedFavorites;
          } catch (e) {
            console.error("Error parsing local favorites:", e);
            return [];
          }
        }
        
        return [];
      }

      // For authenticated users, fetch from database
      const { data, error } = await supabase
        .from('article_favorites')
        .select(`
          article_id,
          articles:article_id (
            id, title, excerpt, author, date, category, imageUrl, status, slug, content
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }

      return data.map(fav => fav.articles) as unknown as Article[];
    },
    enabled: !!(userId || getWalletAddress()),
    retry: 3,
    retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
  });

  const { data: isFavorited, isLoading: isCheckingFavorite } = useQuery({
    queryKey: ['isFavorited', userId, getWalletAddress(), window.location.pathname],
    queryFn: async () => {
      const path = window.location.pathname;
      const match = path.match(/\/blog\/([^\/]+)$/);
      if (!match) return false;
      
      const slug = match[1];
      
      let articleId: number | null = null;
      
      if (!isNaN(Number(slug))) {
        articleId = Number(slug);
      } else {
        const { data: article } = await supabase
          .from('articles')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        articleId = article?.id || null;
      }
      
      if (!articleId) return false;
      
      if (userId) {
        // For authenticated users
        const { data, error } = await supabase
          .from('article_favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('article_id', articleId)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking favorite status:', error);
          return false;
        }
        
        return !!data;
      } else {
        // For wallet or temporary users
        const walletAddress = getWalletAddress();
        if (!walletAddress) return false;
        
        const localFavoritesKey = `wallet_favorites_${walletAddress}`;
        const localFavorites = localStorage.getItem(localFavoritesKey);
        
        if (localFavorites) {
          try {
            const parsedFavorites = JSON.parse(localFavorites);
            const isFav = parsedFavorites.some((fav: Article) => fav.id === articleId);
            console.log(`Article ${articleId} is favorited: ${isFav}`);
            return isFav;
          } catch (e) {
            console.error("Error parsing local favorites:", e);
            return false;
          }
        }
        
        return false;
      }
    },
    enabled: !!(userId || getWalletAddress()),
    retry: 2,
    retryDelay: attempt => Math.min(2 ** attempt * 1000, 10000),
  });

  const { mutate: toggleFavorite, isPending: isToggling } = useMutation({
    mutationFn: async ({ articleId }: { articleId: number }) => {
      if (userId) {
        // For authenticated users
        const { data: existing, error: checkError } = await supabase
          .from('article_favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('article_id', articleId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking favorite:', checkError);
          throw checkError;
        }

        if (existing) {
          const { error } = await supabase
            .from('article_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('article_id', articleId);

          if (error) {
            console.error('Error removing favorite:', error);
            throw error;
          }
          
          return { added: false, articleId, isWalletUser: false };
        } else {
          const { error } = await supabase
            .from('article_favorites')
            .insert({ 
              user_id: userId, 
              article_id: articleId 
            });

          if (error) {
            console.error('Error adding favorite:', error);
            throw error;
          }
          
          return { added: true, articleId, isWalletUser: false };
        }
      } else {
        // For temporary wallet/anonymous users
        const walletAddress = getWalletAddress();
        if (!walletAddress) {
          throw new Error("No wallet address available");
        }
        
        try {
          console.log("Toggling favorite with wallet address:", walletAddress);
          
          const { data: article, error: articleError } = await supabase
            .from('articles')
            .select('id, title, excerpt, author, date, category, imageUrl, status, slug, content')
            .eq('id', articleId)
            .single();
            
          if (articleError) {
            console.error("Error fetching article details:", articleError);
            throw articleError;
          }
          
          const localFavoritesKey = `wallet_favorites_${walletAddress}`;
          let currentFavorites: Article[] = [];
          
          try {
            const storedFavorites = localStorage.getItem(localFavoritesKey);
            currentFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];
          } catch (e) {
            console.error("Error parsing local favorites:", e);
          }
          
          const favIndex = currentFavorites.findIndex(fav => fav.id === articleId);
          const isCurrentlyFavorited = favIndex !== -1;
          
          if (isCurrentlyFavorited) {
            currentFavorites.splice(favIndex, 1);
            localStorage.setItem(localFavoritesKey, JSON.stringify(currentFavorites));
            console.log("Removed article from local favorites");
            
            return { added: false, articleId, isWalletUser: true };
          } else {
            currentFavorites.push(article as Article);
            localStorage.setItem(localFavoritesKey, JSON.stringify(currentFavorites));
            console.log("Added article to local favorites");
            
            return { added: true, articleId, isWalletUser: true };
          }
        } catch (err) {
          console.error("Error processing wallet favorite:", err);
          throw err;
        }
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId, getWalletAddress()] });
      queryClient.invalidateQueries({ queryKey: ['isFavorited', userId, getWalletAddress(), window.location.pathname] });
      
      toast({
        title: result.added ? 'Added to favorites' : 'Removed from favorites',
        description: result.added 
          ? 'Article has been added to your favorites' 
          : 'Article has been removed from your favorites',
        variant: result.added ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      console.error("Favorite toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    favoriteArticles,
    isFavorited,
    toggleFavorite,
    isLoading,
    isCheckingFavorite,
    isToggling
  };
};
