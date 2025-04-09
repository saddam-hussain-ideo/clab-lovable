
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow users to create referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals they've made" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals they've received" ON public.referrals;
DROP POLICY IF EXISTS "Service role can access all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Allow anonymous to create referrals" ON public.referrals;

-- Make sure RLS is enabled
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Allow ANY authenticated user to create referrals - make fully permissive
CREATE POLICY "Allow users to create referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow anonymous users to create referrals too (important for users just signing up)
CREATE POLICY "Allow anonymous to create referrals"
ON public.referrals
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow users to view referrals they've made
CREATE POLICY "Users can view referrals they've made"
ON public.referrals
FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id);

-- Allow users to view referrals they've received
CREATE POLICY "Users can view referrals they've received"
ON public.referrals
FOR SELECT
TO authenticated
USING (auth.uid() = referred_id);

-- Add a special policy for service roles to bypass RLS
CREATE POLICY "Service role can access all referrals"
ON public.referrals
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
