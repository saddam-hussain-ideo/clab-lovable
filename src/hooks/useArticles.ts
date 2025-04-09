
import { useArticleMutations } from "./articles/useArticleMutations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Article } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

export const useArticles = (onlyPublished = true) => {
  // Get all articles
  const { data: articles, isLoading: articlesLoading, error: articlesError } = useQuery({
    queryKey: ['articles', { onlyPublished }],
    queryFn: async () => {
      try {
        console.log('Fetching articles, onlyPublished:', onlyPublished);
        let query = supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Only filter by published status if onlyPublished is true
        if (onlyPublished) {
          query = query.eq('status', 'published');
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching articles:', error);
          toast({
            title: 'Error',
            description: 'Failed to load articles',
            variant: 'destructive'
          });
          throw error;
        }

        console.log('Found articles:', data?.length);
        return (data || []) as Article[];
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load articles',
          variant: 'destructive'
        });
        throw error;
      }
    },
    retry: 1
  });

  const {
    submitArticle,
    isSubmitting,
    deleteArticle,
    updateArticleStatus,
    updateArticle
  } = useArticleMutations();

  return {
    articles,
    articlesLoading,
    articlesError,
    submitArticle,
    isSubmitting,
    deleteArticle,
    updateArticleStatus,
    updateArticle
  };
};
