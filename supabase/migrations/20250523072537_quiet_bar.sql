/*
  # Fix get_active_user_ids function

  1. Changes
    - Drop existing function
    - Recreate function with correct return type
    - Return active user IDs from last 5 minutes
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS get_active_user_ids();

-- Recreate the function with the correct return type
CREATE OR REPLACE FUNCTION get_active_user_ids()
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT active_users.user_id
  FROM active_users
  WHERE (now() - active_users.last_active) < interval '5 minutes'
  AND active_users.status = 'online';
END;
$$;