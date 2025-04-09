
-- Create a function to generate a short, readable referral code
CREATE OR REPLACE FUNCTION public.generate_short_referral_code() 
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer := 0;
  rand_int integer;
  existing_code boolean;
BEGIN
  -- Generate a random code
  LOOP
    -- Reset result
    result := '';
    
    -- Generate an 8-character code
    FOR i IN 1..8 LOOP
      rand_int := floor(random() * length(chars) + 1);
      result := result || substr(chars, rand_int, 1);
    END LOOP;
    
    -- Check if this code already exists
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE referral_code = result
    ) INTO existing_code;
    
    -- If the code doesn't exist, return it
    IF NOT existing_code THEN
      RETURN result;
    END IF;
    
    -- Code exists, try again
  END LOOP;
END;
$$;

-- Create or replace the function to handle new referrals
CREATE OR REPLACE FUNCTION public.handle_referral_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Award points to referrer
    UPDATE profiles 
    SET points = COALESCE(points, 0) + 1000 
    WHERE id = NEW.referrer_id;
    
    -- Award points to referred user
    UPDATE profiles 
    SET points = COALESCE(points, 0) + 1000 
    WHERE id = NEW.referred_id;
    
    RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_referral_created ON public.referrals;

-- Create the trigger
CREATE TRIGGER on_referral_created
AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.handle_referral_signup();

-- Make sure the referrals table has the correct RLS policies
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Allow users to create referrals
CREATE POLICY IF NOT EXISTS "Allow users to create referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view referrals they've made
CREATE POLICY IF NOT EXISTS "Users can view referrals they've made"
ON public.referrals
FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id);

-- Allow users to view referrals they've received
CREATE POLICY IF NOT EXISTS "Users can view referrals they've received"
ON public.referrals
FOR SELECT
TO authenticated
USING (auth.uid() = referred_id);
