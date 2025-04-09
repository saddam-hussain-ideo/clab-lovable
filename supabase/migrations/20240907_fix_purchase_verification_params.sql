
-- Fix the handle_purchase_verification function parameter order to match frontend call pattern
CREATE OR REPLACE FUNCTION public.handle_purchase_verification(
  p_wallet_address TEXT,
  p_tx_hash TEXT,
  p_amount NUMERIC,
  p_network TEXT DEFAULT 'mainnet',
  p_currency TEXT DEFAULT 'SOL',
  p_wallet_type TEXT DEFAULT 'phantom',
  p_initial_status TEXT DEFAULT 'pending',
  p_eth_price NUMERIC DEFAULT NULL
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
  v_eth_usd_price NUMERIC;
BEGIN
  -- Determine if this is an Ethereum network transaction
  v_is_ethereum := p_currency IN ('ETH', 'USDC', 'USDT') AND (p_wallet_type = 'metamask' OR p_wallet_type = 'phantom_ethereum');
  
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
  
  -- Get ETH price - either from parameter, settings, or use fallback
  IF v_is_ethereum AND p_currency = 'ETH' THEN
    -- Use provided ETH price if available
    IF p_eth_price IS NOT NULL AND p_eth_price > 0 THEN
      v_eth_usd_price := p_eth_price;
      RAISE LOG 'Using provided ETH price of $% USD', v_eth_usd_price;
    ELSE
      -- Get from settings otherwise
      SELECT eth_price INTO v_eth_usd_price
      FROM presale_settings
      WHERE id = CASE WHEN p_network = 'mainnet' THEN 'default' ELSE 'testnet' END;
      
      IF v_eth_usd_price IS NULL OR v_eth_usd_price <= 0 THEN
        v_eth_usd_price := 1997; -- Updated default price if not set
        RAISE LOG 'Using default ETH price of $% USD', v_eth_usd_price;
      ELSE
        RAISE LOG 'Using ETH price from settings: $%', v_eth_usd_price;
      END IF;
    END IF;
  END IF;
  
  -- If token_price_usd is not set, calculate it from token price for Solana
  -- For Ethereum, we use a direct USD conversion
  IF v_token_price_usd IS NULL AND NOT v_is_ethereum THEN
    -- Get current price from settings or use a default
    DECLARE
      v_price NUMERIC;
    BEGIN
      SELECT 
        CASE 
          WHEN EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'presale_settings'::regclass AND attname = 'sol_price')
          THEN (SELECT sol_price FROM presale_settings WHERE id = 'default')
          ELSE (SELECT price FROM presale_settings WHERE id = 'default')
        END INTO v_price;
        
      IF v_price IS NULL OR v_price <= 0 THEN
        v_price := 100; -- Default price if not set
      END IF;
      
      -- Calculate USD price
      v_token_price_usd := v_token_price * v_price;
    END;
  END IF;
  
  RAISE LOG 'Token price in USD: %', v_token_price_usd;
  
  -- Calculate token amount
  IF v_is_ethereum THEN
    -- For Ethereum currencies, use the USD price directly
    IF p_currency = 'ETH' THEN
      -- For ETH, we use the ETH/USD price
      v_token_amount := (p_amount * v_eth_usd_price) / v_token_price_usd;
      RAISE LOG 'ETH calculation: % ETH * $% = $% / $% per token = % tokens', 
        p_amount, v_eth_usd_price, (p_amount * v_eth_usd_price), v_token_price_usd, v_token_amount;
    ELSE
      -- For USDC/USDT, amount is already in USD
      v_token_amount := p_amount / v_token_price_usd;
      RAISE LOG 'USD calculation: $% / $% per token = % tokens', 
        p_amount, v_token_price_usd, v_token_amount;
    END IF;
  ELSIF p_currency = 'SOL' THEN
    -- For SOL, use the token price in SOL
    v_token_amount := p_amount / v_token_price;
    RAISE LOG 'SOL calculation: % SOL / % SOL per token = % tokens', 
      p_amount, v_token_price, v_token_amount;
  ELSE
    -- For other Solana tokens (USDC/USDT on Solana), do USD conversion
    -- This is a simplification; in reality, you'd use the actual USD value
    DECLARE
      v_price NUMERIC;
    BEGIN
      SELECT 
        CASE 
          WHEN EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'presale_settings'::regclass AND attname = 'sol_price')
          THEN (SELECT sol_price FROM presale_settings WHERE id = 'default')
          ELSE (SELECT price FROM presale_settings WHERE id = 'default')
        END INTO v_price;
        
      IF v_price IS NULL OR v_price <= 0 THEN
        v_price := 100; -- Default price if not set
      END IF;
      
      -- Calculate token amount (for Solana-based USDC/USDT)
      v_token_amount := (p_amount / v_price) / v_token_price;
      RAISE LOG 'Solana stable calculation: % / % = % SOL / % SOL per token = % tokens', 
        p_amount, v_price, (p_amount / v_price), v_token_price, v_token_amount;
    END;
  END IF;
  
  RAISE LOG 'Final calculated token amount: %', v_token_amount;
  
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
    p_initial_status,
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_purchase_verification: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
