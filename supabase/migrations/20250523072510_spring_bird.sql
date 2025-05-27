/*
  # Fix ambiguous column reference in get_active_user_ids function

  1. Changes
    - Update get_active_user_ids function to explicitly reference active_users.user_id
    - Ensure proper table references to avoid ambiguity
  
  2. Security
    - Function remains accessible to authenticated users only
*/

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