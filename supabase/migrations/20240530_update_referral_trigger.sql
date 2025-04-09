
-- Create or replace the function to handle new referrals
CREATE OR REPLACE FUNCTION public.handle_referral_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Award points to referrer
    UPDATE profiles 
    SET points = points + 1000 
    WHERE id = NEW.referrer_id;
    
    RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_referral_created ON public.referrals;

-- Create the trigger
CREATE TRIGGER on_referral_created
AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.handle_referral_signup();
