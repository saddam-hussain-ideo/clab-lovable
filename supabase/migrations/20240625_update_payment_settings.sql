
-- Add USDC and USDT price columns to payment_settings table
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS usdc_premium_price NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS usdt_premium_price NUMERIC DEFAULT 5;
