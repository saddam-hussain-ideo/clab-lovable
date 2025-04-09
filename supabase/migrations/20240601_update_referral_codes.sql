
-- Update the referral_code generation for better readability
-- This will make new codes shorter while keeping uniqueness

-- Function to generate a more readable random code with a mix of letters and numbers
CREATE OR REPLACE FUNCTION generate_short_referral_code() 
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text[] := ARRAY['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
  result text := '';
  i integer := 0;
BEGIN
  -- Generate a 10-character code (excluding similar looking characters like 1, I, O, 0)
  FOR i IN 1..10 LOOP
    result := result || chars[1 + random() * (array_length(chars, 1) - 1)];
  END LOOP;
  RETURN result;
END;
$$;

-- Modify the default value for new users
ALTER TABLE profiles 
ALTER COLUMN referral_code 
SET DEFAULT generate_short_referral_code();

-- Update existing users with the new format (only those who haven't used their referral code yet)
UPDATE profiles
SET referral_code = generate_short_referral_code()
WHERE id NOT IN (
  SELECT DISTINCT referrer_id FROM referrals
);
