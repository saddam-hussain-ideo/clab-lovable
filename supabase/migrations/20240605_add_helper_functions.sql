
-- Function to check if a table exists and if the current user has access to it
CREATE OR REPLACE FUNCTION public.check_table_access(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  table_exists boolean;
  can_select boolean;
  can_insert boolean;
  can_update boolean;
  can_delete boolean;
  row_count integer;
  result jsonb;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = check_table_access.table_name
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RETURN jsonb_build_object(
      'table_exists', false,
      'message', 'Table does not exist in the public schema'
    );
  END IF;
  
  -- Check permissions
  BEGIN
    EXECUTE format('SELECT COUNT(*) FROM public.%I LIMIT 1', check_table_access.table_name) INTO row_count;
    can_select := true;
  EXCEPTION
    WHEN insufficient_privilege THEN
      can_select := false;
      row_count := null;
  END;
  
  BEGIN
    EXECUTE format('SELECT true FROM public.%I LIMIT 0', check_table_access.table_name);
    can_insert := true;
  EXCEPTION
    WHEN insufficient_privilege THEN
      can_insert := false;
  END;
  
  BEGIN
    EXECUTE format('SELECT true FROM public.%I LIMIT 0', check_table_access.table_name);
    can_update := true;
  EXCEPTION
    WHEN insufficient_privilege THEN
      can_update := false;
  END;
  
  BEGIN
    EXECUTE format('SELECT true FROM public.%I LIMIT 0', check_table_access.table_name);
    can_delete := true;
  EXCEPTION
    WHEN insufficient_privilege THEN
      can_delete := false;
  END;
  
  -- Build result
  result := jsonb_build_object(
    'table_exists', true,
    'table_name', check_table_access.table_name,
    'permissions', jsonb_build_object(
      'select', can_select,
      'insert', can_insert,
      'update', can_update,
      'delete', can_delete
    ),
    'row_count', row_count
  );
  
  -- Check RLS policies
  result := result || jsonb_build_object(
    'rls_policies', (
      SELECT jsonb_agg(jsonb_build_object(
        'policy_name', policyname,
        'command', cmd,
        'roles', roles,
        'using', qual,
        'with_check', with_check
      ))
      FROM pg_policies
      WHERE tablename = check_table_access.table_name
      AND schemaname = 'public'
    )
  );
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.check_table_access IS 'Checks if a table exists and what permissions the current user has on it';
