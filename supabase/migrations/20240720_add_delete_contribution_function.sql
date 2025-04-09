
-- Function to securely delete a presale contribution by ID
CREATE OR REPLACE FUNCTION public.admin_delete_contribution(contribution_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_row public.presale_contributions%ROWTYPE;
  rows_affected integer;
BEGIN
  -- Log the deletion attempt
  RAISE LOG 'Attempting to delete contribution ID: %', contribution_id;
  
  -- Delete the contribution and return the deleted row
  DELETE FROM public.presale_contributions
  WHERE id = contribution_id
  RETURNING * INTO deleted_row;
  
  -- Check if we deleted anything
  IF deleted_row IS NULL THEN
    RAISE LOG 'No contribution found with ID: %', contribution_id;
    RETURN false;
  END IF;
  
  -- Log successful deletion
  RAISE LOG 'Successfully deleted contribution ID: %, wallet: %', 
    contribution_id, deleted_row.wallet_address;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error deleting contribution ID %: %', contribution_id, SQLERRM;
    RAISE EXCEPTION 'Failed to delete contribution: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_delete_contribution(integer) TO authenticated;
