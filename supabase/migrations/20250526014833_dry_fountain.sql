/*
  # Add bug reports and user management features

  1. New Tables
    - `bug_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `message` (text)
      - `created_at` (timestamp)
      - `status` (text)

    - `banned_users`
      - `user_id` (uuid, primary key)
      - `banned_by` (uuid)
      - `reason` (text)
      - `banned_at` (timestamp)
      - `unban_request` (text)
      - `unban_requested_at` (timestamp)

  2. Security
    - Enable RLS on new tables
    - Add policies for bug reports and banned users
*/

-- Create bug reports table
CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending'
);

-- Enable RLS for bug reports
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for bug reports
CREATE POLICY "Users can create bug reports"
  ON bug_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bug reports"
  ON bug_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create banned users table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS banned_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    banned_by uuid REFERENCES auth.users,
    reason text NOT NULL,
    banned_at timestamptz DEFAULT now(),
    unban_request text,
    unban_requested_at timestamptz
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS for banned users if not already enabled
DO $$ BEGIN
  ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policy if it exists and recreate it
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own ban status" ON banned_users;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Create policies for banned users
CREATE POLICY "Users can view their own ban status"
  ON banned_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create or replace function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM banned_users 
    WHERE banned_users.user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to ban user
CREATE OR REPLACE FUNCTION ban_user(
  target_user_id uuid,
  admin_user_id uuid,
  ban_reason text
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
  INSERT INTO banned_users (user_id, banned_by, reason)
  VALUES (target_user_id, admin_user_id, ban_reason)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    banned_by = EXCLUDED.banned_by,
    reason = EXCLUDED.reason,
    banned_at = now(),
    unban_request = null,
    unban_requested_at = null;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to unban user
CREATE OR REPLACE FUNCTION unban_user(
  target_user_id uuid,
  admin_user_id uuid
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

  -- Delete ban record
  DELETE FROM banned_users WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;