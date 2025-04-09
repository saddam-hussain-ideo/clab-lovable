
-- Create a function to create a profile for a wallet and return the profile ID
CREATE OR REPLACE FUNCTION public.create_profile_for_wallet(
  wallet_addr text,
  username text
) 
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
  existing_id uuid;
BEGIN
  -- First check if profile already exists
  SELECT id INTO existing_id
  FROM profiles
  WHERE wallet_address = wallet_addr;
  
  -- Return existing profile ID if found
  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;
  
  -- Generate a new UUID
  SELECT gen_random_uuid() INTO new_id;
  
  -- If no username provided, use AnonBoss
  IF username IS NULL OR username = '' THEN
    username := 'AnonBoss';
  END IF;
  
  -- Insert the new profile with explicit ID
  INSERT INTO public.profiles (id, username, wallet_address)
  VALUES (new_id, username, wallet_addr);
  
  RETURN new_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create profile: %', SQLERRM;
    RETURN NULL;
END;
$$;
