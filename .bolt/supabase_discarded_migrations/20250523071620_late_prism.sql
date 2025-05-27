/*
  # Add fake users function

  1. New Functions
    - `set_fake_users_count`
      - Takes a count parameter
      - Updates the number of fake online users
*/

-- Create table to store fake users count
CREATE TABLE IF NOT EXISTS fake_users_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  fake_count INTEGER DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row
INSERT INTO fake_users_config (id, fake_count) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Function to set fake users count
CREATE OR REPLACE FUNCTION set_fake_users_count(new_count INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE fake_users_config SET fake_count = new_count WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify get_active_user_ids to include fake users
CREATE OR REPLACE FUNCTION get_active_user_ids()
RETURNS TABLE (user_id TEXT) AS $$
DECLARE
  fake_count INTEGER;
BEGIN
  -- Get configured fake count
  SELECT fake_count INTO fake_count FROM fake_users_config WHERE id = 1;
  
  -- Return real active users
  RETURN QUERY SELECT CAST(id AS TEXT) FROM active_users 
    WHERE last_active > NOW() - INTERVAL '24 hours';
    
  -- Add fake users if configured
  IF fake_count > 0 THEN
    FOR i IN 1..fake_count LOOP
      user_id := 'fake_user_' || i;
      RETURN NEXT;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;