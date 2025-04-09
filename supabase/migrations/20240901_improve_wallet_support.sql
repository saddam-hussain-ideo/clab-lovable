
-- Add wallet_type column to wallet_profiles table
ALTER TABLE wallet_profiles 
ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'phantom';

-- Make sure we add an index for faster lookups
CREATE INDEX IF NOT EXISTS wallet_profiles_wallet_type_idx ON wallet_profiles(wallet_type);

-- Update the ensure_wallet_profile function to include the wallet_type parameter
CREATE OR REPLACE FUNCTION public.ensure_wallet_profile(p_wallet_address text, p_wallet_type text DEFAULT 'phantom'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Check if the wallet profile already exists
  SELECT id INTO v_profile_id
  FROM wallet_profiles
  WHERE wallet_address = p_wallet_address;
  
  -- If not found, insert a new profile
  IF v_profile_id IS NULL THEN
    INSERT INTO wallet_profiles (
      wallet_address,
      username,
      wallet_type
    ) VALUES (
      p_wallet_address,
      'AnonBoss', -- Changed from Wallet_prefix to AnonBoss
      p_wallet_type
    )
    RETURNING id INTO v_profile_id;
  ELSE
    -- Update wallet_type if it's not set
    UPDATE wallet_profiles
    SET wallet_type = COALESCE(wallet_type, p_wallet_type)
    WHERE id = v_profile_id;
  END IF;
  
  RETURN v_profile_id;
END;
$function$;

-- Create a function to get or create a wallet profile with specific wallet type
CREATE OR REPLACE FUNCTION public.get_or_create_wallet_profile(p_wallet_address text, p_wallet_type text DEFAULT 'phantom'::text)
RETURNS SETOF wallet_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Get or create the profile
  v_profile_id := ensure_wallet_profile(p_wallet_address, p_wallet_type);
  
  -- Return the profile
  RETURN QUERY
  SELECT * FROM wallet_profiles WHERE id = v_profile_id;
END;
$function$;

-- Create a simpler function specifically for creating wallet profiles directly
CREATE OR REPLACE FUNCTION public.create_profile_for_wallet(
  wallet_addr text,
  username text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_profile_id uuid;
  v_username text;
BEGIN
  -- Check if profile already exists
  SELECT id INTO v_profile_id
  FROM wallet_profiles
  WHERE wallet_address = wallet_addr;
  
  -- If username is NULL, generate a default one
  IF username IS NULL THEN
    v_username := 'Wallet_' || substring(wallet_addr, 1, 6);
  ELSE
    v_username := username;
  END IF;
  
  -- If not found, create a new profile
  IF v_profile_id IS NULL THEN
    INSERT INTO wallet_profiles (
      wallet_address,
      username
    ) VALUES (
      wallet_addr,
      v_username
    )
    RETURNING id INTO v_profile_id;
  END IF;
  
  RETURN v_profile_id;
END;
$function$;

