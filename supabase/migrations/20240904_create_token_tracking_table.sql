
-- Create token_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.token_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  token_amount NUMERIC NOT NULL,
  original_amount NUMERIC DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS token_tracking_wallet_address_idx ON public.token_tracking (wallet_address);
CREATE INDEX IF NOT EXISTS token_tracking_timestamp_idx ON public.token_tracking (timestamp);

-- Set up proper RLS policies
ALTER TABLE public.token_tracking ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see their own token tracking data
CREATE POLICY token_tracking_select_own ON public.token_tracking
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE wallet_address = token_tracking.wallet_address
    )
  );

-- Allow admin users to see all token tracking data
CREATE POLICY token_tracking_admin_all ON public.token_tracking
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Allow the system to insert data
CREATE POLICY token_tracking_insert ON public.token_tracking
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.token_tracking IS 'Table to track token amounts for debugging and auditing purposes';
