
-- Add a new column to store the USD price per token separately
ALTER TABLE public.presale_stages
ADD COLUMN IF NOT EXISTS token_price_usd DECIMAL(18, 8);

-- Update the comment on the table
COMMENT ON COLUMN public.presale_stages.token_price IS 'Price per token in SOL';
COMMENT ON COLUMN public.presale_stages.token_price_usd IS 'Price per token in USD';

-- If token_price_usd is NULL but we have token_price and SOL was around $100,
-- we can set an approximate USD value
UPDATE public.presale_stages
SET token_price_usd = token_price * 100
WHERE token_price_usd IS NULL AND token_price IS NOT NULL;
