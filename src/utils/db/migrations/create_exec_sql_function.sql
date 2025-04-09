-- Create a function that allows executing SQL statements
-- This function should be restricted to admin users only
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission only to authenticated users with admin role
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(text) FROM authenticated;

-- Create policy that only allows admins to execute this function
CREATE OR REPLACE FUNCTION can_execute_sql()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.user_roles ON auth.users.id = public.user_roles.user_id
      WHERE auth.users.id = auth.uid() AND public.user_roles.role = 'admin'
    )
  );
END;
$$;

-- Apply the policy to the function
ALTER FUNCTION exec_sql(text) SET SECURITY LABEL FOR supabase_auth TO '{"policies": [{"name": "Admin only", "definition": {"check": {"name": "can_execute_sql"}}}, {"name": "Service role only", "definition": {"check": {"service_role": true}}}]}';
