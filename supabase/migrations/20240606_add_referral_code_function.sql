
-- Function to generate a short, readable referral code
CREATE OR REPLACE FUNCTION public.generate_short_referral_code() 
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text[] := ARRAY['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
  result text := '';
  i integer := 0;
  code_exists boolean;
BEGIN
  -- Try to generate a unique code (up to 5 attempts)
  FOR attempt IN 1..5 LOOP
    -- Reset result
    result := '';
    
    -- Generate a 8-character code (excluding similar looking characters like 1, I, O, 0)
    FOR i IN 1..8 LOOP
      result := result || chars[1 + floor(random() * array_length(chars, 1))];
    END LOOP;
    
    -- Check if this code already exists
    SELECT EXISTS (
      SELECT 1 FROM profiles WHERE referral_code = result
    ) INTO code_exists;
    
    -- If code is unique, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
  
  -- If we couldn't generate a unique code after 5 attempts,
  -- add a timestamp suffix to ensure uniqueness
  RETURN result || to_char(NOW(), 'SS');
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.generate_short_referral_code IS 'Generates a short, human-readable referral code';
