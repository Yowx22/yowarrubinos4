-- First drop the existing function
DROP FUNCTION IF EXISTS get_active_user_ids();

-- Recreate the function with the correct return type and fake users support
CREATE OR REPLACE FUNCTION get_active_user_ids()
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fake_count INTEGER;
BEGIN
  -- Get configured fake count
  SELECT f.fake_count INTO fake_count 
  FROM fake_users_config f 
  WHERE f.id = 1;

  -- Return real active users
  RETURN QUERY
  SELECT active_users.user_id
  FROM active_users
  WHERE (now() - active_users.last_active) < interval '5 minutes'
  AND active_users.status = 'online';

  -- Add fake users if configured
  IF fake_count > 0 THEN
    FOR i IN 1..fake_count LOOP
      RETURN QUERY SELECT gen_random_uuid();
    END LOOP;
  END IF;
END;
$$;