
-- Create function to initialize the presale_notifications table
CREATE OR REPLACE FUNCTION public.create_presale_notifications_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table already exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'presale_notifications'
  ) THEN
    RETURN true;
  END IF;

  -- Create the table if it doesn't exist
  CREATE TABLE public.presale_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );
  
  -- Add row level security
  ALTER TABLE public.presale_notifications ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for inserting (anyone can insert)
  CREATE POLICY "Anyone can insert their email" 
  ON public.presale_notifications
  FOR INSERT WITH CHECK (true);
  
  -- Create policy for selecting (service role only)
  CREATE POLICY "Service role can select all"
  ON public.presale_notifications
  FOR SELECT USING (auth.role() = 'service_role');
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create presale_notifications table: %', SQLERRM;
    RETURN false;
END;
$$;
