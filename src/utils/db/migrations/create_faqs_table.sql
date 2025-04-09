
-- Create the faqs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Policy for anon users - they can only read
CREATE POLICY "Allow anonymous read" ON public.faqs
  FOR SELECT USING (true);

-- Policy for authenticated users - admin role can manage FAQs
CREATE POLICY "Allow admin users full access" ON public.faqs
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

-- Set up default sort order
CREATE INDEX IF NOT EXISTS idx_faqs_order ON public.faqs (order);
