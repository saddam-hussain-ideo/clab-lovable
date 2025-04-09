
-- Update the handle_purchase_verification function to accept an initial status parameter
CREATE OR REPLACE FUNCTION handle_purchase_verification(
  p_wallet_address TEXT,
  p_tx_hash TEXT,
  p_amount NUMERIC,
  p_network TEXT DEFAULT 'mainnet',
  p_currency TEXT DEFAULT 'SOL',
  p_wallet_type TEXT DEFAULT 'phantom',
  p_initial_status TEXT DEFAULT 'pending'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_stage_id INTEGER;
  v_token_price NUMERIC;
  v_token_price_usd NUMERIC;
  v_token_amount NUMERIC;
  v_user_id UUID;
  v_contribution_id INTEGER;
  v_is_ethereum BOOLEAN;
BEGIN
  -- Determine if this is an Ethereum network transaction
  v_is_ethereum := p_currency IN ('ETH', 'USDC', 'USDT') AND p_wallet_type = 'metamask';
  
  -- Get the current active stage
  SELECT id, token_price, token_price_usd INTO v_stage_id, v_token_price, v_token_price_usd
  FROM presale_stages
  WHERE is_active = true AND network = p_network
  ORDER BY order_number ASC
  LIMIT 1;
  
  IF v_stage_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active presale stage found'
    );
  END IF;
  
  -- If token_price_usd is not set, calculate it from SOL price
  IF v_token_price_usd IS NULL THEN
    -- Get current SOL price from settings or use a default
    DECLARE
      v_sol_price NUMERIC;
    BEGIN
      SELECT sol_price INTO v_sol_price FROM presale_settings WHERE id = 'default';
      IF v_sol_price IS NULL OR v_sol_price <= 0 THEN
        v_sol_price := 100; -- Default SOL price if not set
      END IF;
      
      -- Calculate USD price
      v_token_price_usd := v_token_price * v_sol_price;
    END;
  END IF;
  
  RAISE NOTICE 'Token price in USD: %', v_token_price_usd;
  
  -- Calculate token amount
  IF v_is_ethereum THEN
    -- For Ethereum currencies, use the USD price directly
    IF p_currency = 'ETH' THEN
      -- For ETH, we'd need the ETH price in USD, which we don't have in the database
      -- For now, use a fixed rate of $3000 per ETH
      v_token_amount := (p_amount * 3000) / v_token_price_usd;
    ELSE
      -- For USDC/USDT, amount is already in USD
      v_token_amount := p_amount / v_token_price_usd;
    END IF;
  ELSIF p_currency = 'SOL' THEN
    -- For SOL, use the token price in SOL
    v_token_amount := p_amount / v_token_price;
  ELSE
    -- For other Solana tokens (USDC/USDT on Solana), convert to SOL equivalent first
    -- This is a simplification; in reality, you'd use the actual USD value
    DECLARE
      v_sol_price NUMERIC;
    BEGIN
      SELECT sol_price INTO v_sol_price FROM presale_settings WHERE id = 'default';
      IF v_sol_price IS NULL OR v_sol_price <= 0 THEN
        v_sol_price := 100; -- Default SOL price if not set
      END IF;
      
      -- Calculate SOL equivalent and then tokens
      v_token_amount := (p_amount / v_sol_price) / v_token_price;
    END;
  END IF;
  
  RAISE NOTICE 'Calculated token amount: %', v_token_amount;
  
  -- Look up user_id if wallet is linked to a profile
  SELECT id INTO v_user_id
  FROM profiles
  WHERE wallet_address = p_wallet_address;
  
  -- Record the transaction with the provided initial status
  INSERT INTO presale_contributions (
    wallet_address,
    tx_hash,
    sol_amount,
    token_amount,
    status,
    stage_id,
    network,
    currency,
    user_id,
    wallet_type,
    original_amount
  ) VALUES (
    p_wallet_address,
    p_tx_hash,
    CASE WHEN p_currency = 'SOL' THEN p_amount ELSE NULL END,
    v_token_amount,
    p_initial_status, -- Use the provided initial status instead of hardcoded 'confirmed'
    v_stage_id,
    p_network,
    p_currency,
    v_user_id,
    p_wallet_type,
    p_amount
  )
  RETURNING id INTO v_contribution_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'contribution_id', v_contribution_id,
    'token_amount', v_token_amount,
    'stage_id', v_stage_id
  );
END;
$$;
