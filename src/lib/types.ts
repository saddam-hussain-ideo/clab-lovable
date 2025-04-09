
// Import z from our pre-configured zod-config
import { z } from '@/lib/zod-config';

export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  status: 'draft' | 'published';
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  is_featured?: boolean;
  created_at?: string; // Adding this field to match database schema
}

export type NewArticle = Omit<Article, 'id' | 'slug'>;

// Re-export z for use throughout the application
export { z };
