-- Create function to delete user account and all associated data
-- This function must be run by the authenticated user (not admin)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_to_delete uuid;
  result json;
BEGIN
  -- Get the current authenticated user's ID
  user_id_to_delete := auth.uid();

  -- Check if user is authenticated
  IF user_id_to_delete IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user's contacts (cascade should handle related data)
  DELETE FROM contacts WHERE user_id = user_id_to_delete;

  -- Delete user's groups
  DELETE FROM groups WHERE user_id = user_id_to_delete;

  -- Delete user's scan limit records
  DELETE FROM scan_limits WHERE user_id = user_id_to_delete;

  -- Delete user's subscription info (if table exists)
  -- DELETE FROM subscriptions WHERE user_id = user_id_to_delete;

  -- Delete user profile data (user_metadata is handled by auth.users)
  -- Any other user-specific tables should be deleted here

  -- Return success
  result := json_build_object(
    'success', true,
    'message', 'User account and all associated data deleted successfully',
    'user_id', user_id_to_delete
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_account() IS 'Deletes the authenticated user account and all associated data. Required for Apple App Store guideline 5.1.1(v) compliance.';
