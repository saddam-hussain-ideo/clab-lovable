
-- Update the handle_purchase_verification function to better handle Ethereum currencies
CREATE OR REPLACE FUNCTION handle_purchase_verification(
  p_wallet_address TEXT,
  p_tx_hash TEXT,
  p_amount NUMERIC,
  p_network TEXT DEFAULT 'mainnet',
  p_currency TEXT DEFAULT 'SOL',
  p_wallet_type TEXT DEFAULT 'phantom'
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
  v_sol_price NUMERIC;
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
  
  -- Get SOL price from settings
  SELECT sol_price INTO v_sol_price
  FROM presale_settings
  WHERE id = CASE WHEN p_network = 'mainnet' THEN 'default' ELSE 'testnet' END;
  
  -- Default to 133 if not set (more current value)
  IF v_sol_price IS NULL OR v_sol_price <= 0 THEN
    v_sol_price := 133; -- Updated default SOL price
  END IF;
  
  -- If token_price_usd is not set, calculate it from SOL price
  IF v_token_price_usd IS NULL THEN
    -- Calculate USD price using actual SOL price
    v_token_price_usd := v_token_price * v_sol_price;
    
    RAISE NOTICE 'Calculated token price in USD: % (SOL price: $%)', v_token_price_usd, v_sol_price;
  END IF;
  
  -- Calculate token amount
  IF v_is_ethereum THEN
    -- For Ethereum currencies, use the USD price directly
    IF p_currency = 'ETH' THEN
      -- For ETH, get the ETH price from settings or use a reasonable default
      DECLARE
        v_eth_price NUMERIC;
      BEGIN
        SELECT eth_price INTO v_eth_price 
        FROM presale_settings 
        WHERE id = CASE WHEN p_network = 'mainnet' THEN 'default' ELSE 'testnet' END;
        
        IF v_eth_price IS NULL OR v_eth_price <= 0 THEN
          v_eth_price := 3000; -- Default ETH price
        END IF;
        
        v_token_amount := (p_amount * v_eth_price) / v_token_price_usd;
        RAISE NOTICE 'ETH calculation: % ETH * $% = $% / $% per token = % tokens',
          p_amount, v_eth_price, (p_amount * v_eth_price), v_token_price_usd, v_token_amount;
      END;
    ELSE
      -- For USDC/USDT, amount is already in USD
      v_token_amount := p_amount / v_token_price_usd;
    END IF;
  ELSIF p_currency = 'SOL' THEN
    -- For SOL, use the token price in SOL
    v_token_amount := p_amount / v_token_price;
  ELSE
    -- For other Solana tokens (USDC/USDT on Solana), use actual SOL price
    -- Calculate token amount (for Solana-based USDC/USDT)
    v_token_amount := (p_amount / v_sol_price) / v_token_price;
    RAISE NOTICE 'Solana stable calculation: % / % = % SOL / % SOL per token = % tokens',
      p_amount, v_sol_price, (p_amount / v_sol_price), v_token_price, v_token_amount;
  END IF;
  
  RAISE NOTICE 'Calculated token amount: %', v_token_amount;
  
  -- Look up user_id if wallet is linked to a profile
  SELECT id INTO v_user_id
  FROM profiles
  WHERE wallet_address = p_wallet_address;
  
  -- Record the transaction
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
    'confirmed',
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
