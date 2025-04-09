
-- Enhance the is_username_taken function to be case-insensitive and more robust
CREATE OR REPLACE FUNCTION public.is_username_taken(p_username text, p_current_user_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check in profiles table (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE LOWER(username) = LOWER(p_username) 
    AND (p_current_user_id IS NULL OR id != p_current_user_id)
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check in wallet_profiles table (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM wallet_profiles 
    WHERE LOWER(username) = LOWER(p_username)
    AND (p_current_user_id IS NULL)
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Add a check constraint to profiles table to enforce username format
ALTER TABLE profiles 
  ADD CONSTRAINT username_format_check 
  CHECK (
    username IS NULL OR 
    (
      LENGTH(username) BETWEEN 3 AND 50 AND
      username ~ '^[a-zA-Z0-9_.-]+$' AND
      username !~ '\.\.'
    )
  );

-- Add a check constraint to wallet_profiles table to enforce username format
ALTER TABLE wallet_profiles 
  ADD CONSTRAINT wallet_username_format_check 
  CHECK (
    username IS NULL OR 
    (
      LENGTH(username) BETWEEN 3 AND 50 AND
      username ~ '^[a-zA-Z0-9_.-]+$' AND
      username !~ '\.\.'
    )
  );
