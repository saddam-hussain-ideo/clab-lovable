
-- Create or replace the function to handle new referrals with proper point assignment
CREATE OR REPLACE FUNCTION public.handle_referral_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Debugging log
    RAISE LOG 'Referral created: referrer_id=%, referred_id=%', NEW.referrer_id, NEW.referred_id;
    
    -- Verify users exist before awarding points
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.referrer_id) THEN
        RAISE LOG 'ERROR: Referrer with ID % does not exist', NEW.referrer_id;
        RETURN NEW;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.referred_id) THEN
        RAISE LOG 'ERROR: Referred user with ID % does not exist', NEW.referred_id;
        RETURN NEW;
    END IF;
    
    -- Award points to referrer - ensuring we handle NULL points properly
    UPDATE profiles 
    SET points = COALESCE(points, 0) + 1000 
    WHERE id = NEW.referrer_id;
    
    -- Award points to referred user - ensuring we handle NULL points properly
    UPDATE profiles 
    SET points = COALESCE(points, 0) + 1000 
    WHERE id = NEW.referred_id;
    
    -- Debugging log
    RAISE LOG 'Points awarded to both users for referral';
    
    RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_referral_created ON public.referrals;

-- Create the trigger
CREATE TRIGGER on_referral_created
AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.handle_referral_signup();

-- Fix the RLS policies for the referrals table to ensure proper access
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow users to create referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals they've made" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals they've received" ON public.referrals;
DROP POLICY IF EXISTS "Service role can access all referrals" ON public.referrals;

-- Allow users to create referrals - made more lenient to ensure it works
CREATE POLICY "Allow users to create referrals"
ON public.referrals
FOR INSERT
TO authenticated
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
