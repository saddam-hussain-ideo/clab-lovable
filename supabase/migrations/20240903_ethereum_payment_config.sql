
-- Add ethereum_address column to payment_settings
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS ethereum_address TEXT;

-- Add test ethereum address for testnet
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS test_ethereum_address TEXT;

-- Add ethereum_usdt_address and ethereum_usdc_address columns to payment_settings
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS ethereum_usdt_address TEXT;

ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS ethereum_usdc_address TEXT;
