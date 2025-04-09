
export interface Logo {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
}

export interface PendingUpload {
  logoId: string;
  tempUrl: string;
  fileName: string;
}
