
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { NewArticle } from "@/lib/types";
import { toast } from "sonner";

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const useArticleMutations = () => {
  const queryClient = useQueryClient();

  const { mutate: submitArticle, isPending: isSubmitting } = useMutation({
    mutationFn: async (article: NewArticle) => {
      const slug = generateSlug(article.title);
      console.log('Submitting article with date:', article.date);
      const { data, error } = await supabase
        .from('articles')
        .insert([{
          ...article,
          slug,
          date: article.date // Ensure date is in YYYY-MM-DD format
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Article submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error) => {
      console.error('Error submitting article:', error);
      toast.error("Failed to submit article. Please try again.");
    }
  });

  const { mutate: updateArticle } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: NewArticle }) => {
      const slug = generateSlug(data.title);
      console.log('Updating article with date:', data.date);
      const { data: updatedArticle, error } = await supabase
        .from('articles')
        .update({
          ...data,
          slug,
          date: data.date // Ensure date is in YYYY-MM-DD format
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return updatedArticle;
    },
    onSuccess: () => {
      toast.success("Article updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error) => {
      console.error('Error updating article:', error);
      toast.error("Failed to update article. Please try again.");
    }
  });

  const { mutate: deleteArticle } = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error) => {
      console.error('Error deleting article:', error);
      toast.error("Failed to delete article. Please try again.");
    }
  });

  const { mutate: updateArticleStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'draft' | 'published' }) => {
      const { data, error } = await supabase
        .from('articles')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Article has been ${variables.status === 'published' ? 'published' : 'moved to drafts'}.`);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error) => {
      console.error('Error updating article status:', error);
      toast.error("Failed to update article status. Please try again.");
    }
  });

  return {
    submitArticle,
    isSubmitting,
    deleteArticle,
    updateArticleStatus,
    updateArticle: (id: number, data: NewArticle) => updateArticle({ id, data })
  };
};
