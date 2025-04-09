import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { withRetry } from "@/utils/retry/retryUtils";
import { PostgrestResponse } from "@supabase/supabase-js";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  created_at: string;
}

// Fetch all FAQs ordered by their defined order
export const fetchFaqs = async (): Promise<FaqItem[]> => {
  try {
    const result = await withRetry<PostgrestResponse<FaqItem>>(
      async () => await supabase
        .from('faqs')
        .select('*')
        .order('order', { ascending: true }),
      { context: 'fetchFaqs' }
    );

    if (result.error) {
      console.error('Error fetching FAQs:', result.error);
      throw result.error;
    }

    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    return [];
  }
};

// Add a new FAQ item
export const addFaq = async (faq: Omit<FaqItem, 'id' | 'created_at'>): Promise<FaqItem> => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .insert([faq])
      .select('*')
      .single(); // Ensure we get a single record back, not an array
    
    if (error) {
      console.error('Error adding FAQ:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in addFaq:', error);
    throw error;
  }
};

// Update an existing FAQ
export const updateFaq = async (id: string, question: string, answer: string): Promise<boolean> => {
  try {
    const result = await withRetry<PostgrestResponse<null>>(
      async () => await supabase
        .from('faqs')
        .update({ question, answer })
        .eq('id', id),
      { context: 'updateFaq' }
    );

    if (result.error) {
      console.error('Error updating FAQ:', result.error);
      throw result.error;
    }

    return true;
  } catch (error) {
    console.error('Failed to update FAQ:', error);
    return false;
  }
};

// Delete a FAQ
export const deleteFaq = async (id: string): Promise<boolean> => {
  try {
    const result = await withRetry<PostgrestResponse<null>>(
      async () => await supabase
        .from('faqs')
        .delete()
        .eq('id', id),
      { context: 'deleteFaq' }
    );

    if (result.error) {
      console.error('Error deleting FAQ:', result.error);
      throw result.error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete FAQ:', error);
    return false;
  }
};
