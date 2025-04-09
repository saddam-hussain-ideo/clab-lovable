
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Article } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

export const useBlogData = () => {
  const { data: articles, isLoading: articlesLoading, error } = useQuery({
    queryKey: ['articles', 'published'],
    queryFn: async () => {
      try {
        console.log('Fetching articles for blog page');
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching published articles:', error);
          throw error;
        }
        
        console.log('Successfully fetched published articles, count:', data?.length);
        return data as Article[];
      } catch (error) {
        console.error('Failed to fetch published articles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load blog articles',
          variant: 'destructive'
        });
        throw error;
      }
    }
  });

  const { data: activeBanner } = useQuery({
    queryKey: ['active-blog-banner'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('blog_banners')
          .select('*')
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching banner:', error);
          return null;
        }
        return data;
      } catch (error) {
        console.error('Failed to fetch active blog banner:', error);
        return null;
      }
    }
  });

  const { data: primaryAd } = useQuery({
    queryKey: ['primary-ad'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('advertisements')
          .select('*')
          .eq('is_active', true)
          .eq('type', 'square')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching primary ad:', error);
          return null;
        }
        return data;
      } catch (error) {
        console.error('Failed to fetch primary ad:', error);
        return null;
      }
    }
  });

  const { data: horizontalAd } = useQuery({
    queryKey: ['horizontal-ad'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('advertisements')
          .select('*')
          .eq('is_active', true)
          .eq('type', 'horizontal')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching horizontal ad:', error);
          return null;
        }
        return data;
      } catch (error) {
        console.error('Failed to fetch horizontal ad:', error);
        return null;
      }
    }
  });

  // Extract unique categories and sort them alphabetically
  const categories = articles 
    ? [...new Set(articles.filter(a => a.category).map(article => article.category))].sort() 
    : [];

  return {
    articles,
    articlesLoading,
    error,
    activeBanner,
    primaryAd,
    horizontalAd,
    categories,
  };
};
