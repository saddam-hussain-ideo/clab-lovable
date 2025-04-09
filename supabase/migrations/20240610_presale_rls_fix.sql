
-- Check if a policy exists
CREATE OR REPLACE FUNCTION public.check_policy_exists(table_name text, policy_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policy_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name 
    AND policyname = policy_name
  ) INTO policy_exists;
  
  RETURN policy_exists;
END;
$$;

-- Create an anonymous contribution policy function
CREATE OR REPLACE FUNCTION public.create_anon_contribution_policy()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop the policy if it exists
  DROP POLICY IF EXISTS "Allow anonymous contributions" ON public.presale_contributions;
  
  -- Create the policy
  CREATE POLICY "Allow anonymous contributions" ON public.presale_contributions
  FOR INSERT TO anon
  WITH CHECK (true);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create policy: %', SQLERRM;
    RETURN false;
END;
$$;

-- Create a profile for a wallet
CREATE OR REPLACE FUNCTION public.create_profile_for_wallet(wallet_addr text, username text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Generate a new UUID
  SELECT gen_random_uuid() INTO new_id;
  
  -- Insert the new profile
  INSERT INTO public.profiles (id, username, wallet_address)
  VALUES (new_id, username, wallet_addr);
  
  RETURN new_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create profile: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Admin function to record a contribution
CREATE OR REPLACE FUNCTION public.admin_record_contribution(
  wallet_addr text,
  sol_amt numeric,
  token_amt numeric,
  transaction_hash text,
  network_name text DEFAULT 'testnet',
  currency_name text DEFAULT 'SOL',
  status_value text DEFAULT 'pending',
  stage_id_value integer DEFAULT NULL,
  original_currency_value text DEFAULT NULL,
  original_amount_value numeric DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  contribution_id integer;
BEGIN
  INSERT INTO public.presale_contributions (
    wallet_address,
    sol_amount,
    token_amount,
    tx_hash,
    network,
    currency,
    status,
    stage_id,
    original_currency,
    original_amount
  ) VALUES (
    wallet_addr,
    sol_amt,
    token_amt,
    transaction_hash,
    network_name,
    currency_name,
    status_value,
    stage_id_value,
    original_currency_value,
    original_amount_value
  )
  RETURNING id INTO contribution_id;
  
  RETURN contribution_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to insert contribution: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Insert presale contribution using service role
CREATE OR REPLACE FUNCTION public.insert_presale_contribution(contribution jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  contribution_id integer;
  wallet_address_val text;
  sol_amount_val numeric;
  token_amount_val numeric;
  tx_hash_val text;
  network_val text;
  currency_val text;
  status_val text;
  stage_id_val integer;
  original_currency_val text;
  original_amount_val numeric;
BEGIN
  -- Extract values from the input JSON with proper type casting
  wallet_address_val := contribution->>'wallet_address';
  sol_amount_val := (contribution->>'sol_amount')::numeric;
  token_amount_val := (contribution->>'token_amount')::numeric;
  tx_hash_val := contribution->>'tx_hash';
  network_val := COALESCE(contribution->>'network', 'testnet');
  currency_val := COALESCE(contribution->>'currency', 'SOL');
  status_val := COALESCE(contribution->>'status', 'pending');
  
  -- Handle optional values carefully
  BEGIN
    stage_id_val := (contribution->>'stage_id')::integer;
  EXCEPTION WHEN OTHERS THEN
    stage_id_val := NULL;
  END;
  
  original_currency_val := contribution->>'original_currency';
  
  BEGIN
    original_amount_val := (contribution->>'original_amount')::numeric;
  EXCEPTION WHEN OTHERS THEN
    original_amount_val := NULL;
  END;

  INSERT INTO public.presale_contributions (
    wallet_address,
    sol_amount,
    token_amount,
    tx_hash,
    network,
    currency,
    status,
    stage_id,
    original_currency,
    original_amount
  ) VALUES (
    wallet_address_val,
    sol_amount_val,
    token_amount_val,
    tx_hash_val,
    network_val,
    currency_val,
    status_val,
    stage_id_val,
    original_currency_val,
    original_amount_val
  )
  RETURNING id INTO contribution_id;
  
  -- Create a jsonb object to return using jsonb_build_object instead of to_jsonb
  SELECT jsonb_build_object(
    'id', contribution_id,
    'wallet_address', wallet_address_val,
    'sol_amount', sol_amount_val,
    'token_amount', token_amount_val,
    'tx_hash', tx_hash_val,
    'network', network_val,
    'currency', currency_val,
    'status', status_val,
    'stage_id', stage_id_val,
    'original_currency', original_currency_val,
    'original_amount', original_amount_val
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Service role insert failed: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Update RLS policies to allow any wallet to record their own contributions
DROP POLICY IF EXISTS "Allow all wallets to insert their contributions" ON public.presale_contributions;

CREATE POLICY "Allow all wallets to insert their contributions"
ON public.presale_contributions
FOR INSERT
TO anon
WITH CHECK (true);

-- Execute the anonymous contribution policy function to ensure it's applied
SELECT public.create_anon_contribution_policy();
