-- This script should be run in the Supabase SQL Editor
-- It will fix the wallet_profiles table to allow the same wallet address with different wallet types

-- Drop the existing unique constraint on wallet_address
ALTER TABLE public.wallet_profiles
DROP CONSTRAINT IF EXISTS wallet_profiles_wallet_address_key;

-- Add a new composite unique constraint on wallet_address and wallet_type
ALTER TABLE public.wallet_profiles
ADD CONSTRAINT wallet_profiles_wallet_address_wallet_type_key
UNIQUE (wallet_address, wallet_type);

-- This allows the same wallet address to exist with different wallet types
-- For example, the same address can be used with both MetaMask and Phantom

-- Verify the change by describing the table constraints
SELECT con.*
FROM pg_catalog.pg_constraint con
INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
WHERE rel.relname = 'wallet_profiles'
AND nsp.nspname = 'public';
