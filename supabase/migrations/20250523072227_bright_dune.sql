/*
  # Add fake users functionality

  1. New Tables
    - `fake_users_config`
      - `id` (integer, primary key)
      - `fake_count` (integer, default 0)

  2. Functions
    - Drop and recreate `get_active_user_ids` to include fake users
    - Add `set_fake_users_count` function
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

-- Drop existing function before recreating with new return type
DROP FUNCTION IF EXISTS get_active_user_ids();

-- Create new version of get_active_user_ids to include fake users
CREATE OR REPLACE FUNCTION get_active_user_ids()
RETURNS TABLE (user_id TEXT) AS $$
DECLARE
  fake_users INTEGER;
BEGIN
  -- Get configured fake count
  SELECT f.fake_count INTO fake_users 
  FROM fake_users_config f 
  WHERE f.id = 1;
  
  -- Return real active users
  RETURN QUERY SELECT CAST(id AS TEXT) FROM active_users 
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