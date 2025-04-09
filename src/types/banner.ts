
export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null; 
  description?: string | null;
  image_url?: string | null;
  target_url?: string | null;
  button_text?: string | null;
  is_active: boolean;
  position: 'hero' | 'blog';
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface BannerUpdateInput extends Partial<Banner> {
  id: string;
}

export interface BannerManagerProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>, bannerId?: string) => Promise<void>;
  uploading: boolean;
  onUpdate: (banner: BannerUpdateInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, direction: 'up' | 'down') => Promise<void>;
}
