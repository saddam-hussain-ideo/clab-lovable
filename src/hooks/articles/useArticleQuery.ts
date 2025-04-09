
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Article } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

export const useArticleQuery = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      if (!slug) {
        console.error('No slug provided to useArticleQuery');
        throw new Error('Article not found');
      }

      console.log('Attempting to fetch article with slug:', slug);
      
      // Try to decode the slug if it's URL encoded
      const decodedSlug = decodeURIComponent(slug);
      
      // Normalize the slug - lowercase and trim
      const normalizedSlug = decodedSlug.toLowerCase().trim();
      
      // First try to find by slug directly
      let { data: slugData, error: slugError } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', normalizedSlug)
        .eq('status', 'published') // Only get published articles
        .maybeSingle();
      
      if (slugData) {
        console.log('Found article by slug:', slugData);
        return slugData as Article;
      }

      // If not found, check if this could be a numeric id
      if (/^\d+$/.test(slug)) {
        const id = parseInt(slug, 10);
        let { data: idData, error: idError } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .eq('status', 'published') // Only get published articles
          .maybeSingle();
        
        if (idData) {
          console.log('Found article by ID:', idData);
          return idData as Article;
        }
      }
      
      // Try with alternative normalizations or patterns
      const patterns = [
        normalizedSlug,
        normalizedSlug.replace(/-/g, ' '), // Replace hyphens with spaces
        normalizedSlug.replace(/_/g, '-')  // Replace underscores with hyphens
      ];
      
      for (const pattern of patterns) {
        if (pattern === normalizedSlug) continue; // Skip if already tried
        
        let { data: patternData } = await supabase
          .from('articles')
          .select('*')
          .ilike('slug', pattern)
          .eq('status', 'published')
          .maybeSingle();
        
        if (patternData) {
          console.log('Found article by alternative pattern:', patternData);
          return patternData as Article;
        }
      }
      
      console.error('Article not found for slug:', slug);
      toast({
        title: "Article not found",
        description: "The article you're looking for could not be found",
        variant: "destructive"
      });
      throw new Error('Article not found');
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
