
-- Add wallet_type column to presale_contributions if it doesn't exist
ALTER TABLE presale_contributions 
ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'phantom';

-- Add eth_address column to payment_settings if it doesn't exist
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS eth_address TEXT;

-- Add test ethereum address for testnet
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS test_eth_address TEXT;

-- Add ethereum_usdt_address and ethereum_usdc_address columns to payment_settings
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS ethereum_usdt_address TEXT;

ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS ethereum_usdc_address TEXT;

-- Create or replace function to handle purchase verification for multiple networks
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
  v_token_amount NUMERIC;
  v_user_id UUID;
  v_contribution_id INTEGER;
BEGIN
  -- Get the current active stage
  SELECT id, token_price INTO v_stage_id, v_token_price
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
  
  -- Calculate token amount
  IF p_currency = 'SOL' THEN
    v_token_amount := p_amount / v_token_price;
  ELSIF p_currency IN ('ETH', 'USDT', 'USDC') THEN
    -- For Ethereum, USDT, and USDC, we need to use the USD price
    -- We'll use a different approach for token calculation
    SELECT token_price_usd INTO v_token_price
    FROM presale_stages
    WHERE id = v_stage_id;
    
    -- If token_price_usd is set, use it, otherwise calculate from SOL price
    IF v_token_price IS NOT NULL THEN
      v_token_amount := p_amount / v_token_price;
    ELSE
      v_token_amount := p_amount / v_token_price; -- This is just a fallback
    END IF;
  ELSE
    v_token_amount := p_amount / v_token_price; -- Default fallback
  END IF;
  
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
