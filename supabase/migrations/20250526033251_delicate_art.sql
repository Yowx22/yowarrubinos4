/*
  # Add temporary ban functionality

  1. Changes
    - Add ban_duration column to banned_users table
    - Update ban_user function to support temporary bans
    - Add function to check if user is currently banned
*/

-- Add ban_duration column to banned_users table
ALTER TABLE banned_users
ADD COLUMN IF NOT EXISTS ban_duration interval;

-- Update ban_user function to support temporary bans
CREATE OR REPLACE FUNCTION ban_user(
  target_user_id uuid,
  admin_user_id uuid,
  ban_reason text,
  duration interval DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Check if admin has permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = admin_user_id AND (is_admin = true OR is_owner = true)
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Insert or update ban record
  INSERT INTO banned_users (
    user_id, 
    banned_by, 
    reason, 
    ban_duration
  )
  VALUES (
    target_user_id, 
    admin_user_id, 
    ban_reason,
    duration
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    banned_by = EXCLUDED.banned_by,
    reason = EXCLUDED.reason,
    banned_at = now(),
    ban_duration = EXCLUDED.ban_duration,
    unban_request = null,
    unban_requested_at = null;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is currently banned
CREATE OR REPLACE FUNCTION is_user_banned(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM banned_users 
    WHERE banned_users.user_id = $1
    AND (
      ban_duration IS NULL 
      OR 
      banned_at + ban_duration > now()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;