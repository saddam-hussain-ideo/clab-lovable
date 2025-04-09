-- First, let's check all constraints on the wallet_profiles table
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM 
    pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE 
    rel.relname = 'wallet_profiles'
    AND nsp.nspname = 'public';

-- Let's also check all indexes on the wallet_profiles table
SELECT
    i.relname AS index_name,
    a.attname AS column_name,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary
FROM
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
WHERE
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname = 'wallet_profiles';

-- Let's check if there are any dependent objects
SELECT 
    d.objid,
    d.classid,
    d.objid,
    d.deptype,
    pg_identify_object(d.classid, d.objid, d.objsubid) as dependent_object
FROM pg_depend d
JOIN pg_class c ON c.oid = d.refobjid
WHERE c.relname = 'wallet_profiles' AND c.relkind = 'r';

-- Let's check for any functions that might depend on the table
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.prosrc LIKE '%wallet_profiles%';

-- Instead of recreating the table, let's just modify the existing constraint
DO $$
BEGIN
    -- Try to drop the constraint by name
    BEGIN
        ALTER TABLE public.wallet_profiles DROP CONSTRAINT IF EXISTS wallet_profiles_wallet_address_key;
        RAISE NOTICE 'Constraint wallet_profiles_wallet_address_key dropped successfully';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'Constraint wallet_profiles_wallet_address_key does not exist';
    END;
    
    -- Also try with a different naming convention that Supabase might use
    BEGIN
        ALTER TABLE public.wallet_profiles DROP CONSTRAINT IF EXISTS wallet_profiles_wallet_address_unique;
        RAISE NOTICE 'Constraint wallet_profiles_wallet_address_unique dropped successfully';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'Constraint wallet_profiles_wallet_address_unique does not exist';
    END;
    
    -- Try the idx_wallet_profiles_wallet_address constraint
    BEGIN
        ALTER TABLE public.wallet_profiles DROP CONSTRAINT IF EXISTS idx_wallet_profiles_wallet_address;
        RAISE NOTICE 'Constraint idx_wallet_profiles_wallet_address dropped successfully';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'Constraint idx_wallet_profiles_wallet_address does not exist';
    END;
    
    -- Try dropping the index directly
    BEGIN
        DROP INDEX IF EXISTS idx_wallet_profiles_wallet_address;
        RAISE NOTICE 'Index idx_wallet_profiles_wallet_address dropped successfully';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'Index idx_wallet_profiles_wallet_address does not exist';
    END;
    
    -- Now add the new composite constraint
    BEGIN
        ALTER TABLE public.wallet_profiles 
        ADD CONSTRAINT wallet_profiles_wallet_address_wallet_type_key 
        UNIQUE (wallet_address, wallet_type);
        RAISE NOTICE 'New composite constraint added successfully';
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'Constraint wallet_profiles_wallet_address_wallet_type_key already exists';
    END;
END $$;

-- Verify the constraints on the table after modifications
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM 
    pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE 
    rel.relname = 'wallet_profiles'
    AND nsp.nspname = 'public';

-- Verify the indexes on the table after modifications
SELECT
    i.relname AS index_name,
    a.attname AS column_name,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary
FROM
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
WHERE
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname = 'wallet_profiles';
