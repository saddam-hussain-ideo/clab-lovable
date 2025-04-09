export interface Profile {
  id: string | null;
  username: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  points: number | null;
  wallet_type: string | null;
  created_at?: string; // ISO timestamp of profile creation
  updated_at?: string; // ISO timestamp of last update
  
  // Client-side only properties (not in database)
  email?: string | null;
  experience_level?: string;
  interests?: string[];
  social_links?: Record<string, string>;
  referral_code?: string | null;
  role?: string;
  bio?: string;
}
