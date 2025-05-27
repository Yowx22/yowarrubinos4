/*
  # Fix active users query

  1. Changes
    - Update get_active_user_ids function to use user_id instead of id
    - Drop existing function to avoid conflicts
    - Recreate function with correct column reference
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_active_user_ids();

-- Create new version of get_active_user_ids with correct column reference
CREATE OR REPLACE FUNCTION get_active_user_ids()
RETURNS TABLE (user_id TEXT) AS $$
DECLARE
  fake_users INTEGER;
BEGIN
  -- Get configured fake count
  SELECT f.fake_count INTO fake_users 
  FROM fake_users_config f 
  WHERE f.id = 1;
  
  -- Return real active users using user_id instead of id
  RETURN QUERY SELECT CAST(user_id AS TEXT) FROM active_users 
    WHERE last_active > NOW() - INTERVAL '24 hours';
    
  -- Add fake users if configured
  IF fake_users > 0 THEN
    FOR i IN 1..fake_users LOOP
      user_id := 'fake_user_' || i;
      RETURN NEXT;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;