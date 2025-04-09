-- Drop the existing unique constraint on wallet_address
ALTER TABLE public.wallet_profiles
DROP CONSTRAINT IF EXISTS wallet_profiles_wallet_address_key;

-- Add a new composite unique constraint on wallet_address and wallet_type
ALTER TABLE public.wallet_profiles
ADD CONSTRAINT wallet_profiles_wallet_address_wallet_type_key
UNIQUE (wallet_address, wallet_type);

-- This allows the same wallet address to exist with different wallet types
-- For example, the same address can be used with both MetaMask and Phantom
