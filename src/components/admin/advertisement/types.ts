
// Update the allowed ad types to match database constraints
export type AdType = "banner" | "sidebar" | "leaderboard";

export type Advertisement = {
  id: number;
  type: AdType;
  image_url: string;
  target_url: string;
  is_active: boolean;
  position?: string; // Add position field to match database schema
};

export type AdFormData = {
  imageUrl: string;
  targetUrl: string;
  type: AdType;
  isActive: boolean;
};
