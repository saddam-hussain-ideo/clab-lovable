
-- Create a function to manually process referrals if the trigger fails
CREATE OR REPLACE FUNCTION public.manually_process_referral(referrer_id UUID, referred_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Award points to referrer
    UPDATE profiles 
    SET points = points + 1000 
    WHERE id = referrer_id;
    
    -- Award points to referred user
    UPDATE profiles 
    SET points = points + 1000 
    WHERE id = referred_id;
END;
$$;
