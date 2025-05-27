/*
  # Add rigging functionality

  1. New Tables
    - `rigged_users`
      - `user_id` (uuid, primary key)
      - `rigged_by` (uuid)
      - `win_chance` (float)
      - `created_at` (timestamptz)

  2. Functions
    - Add check_rigged_status function
*/

CREATE TABLE IF NOT EXISTS rigged_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  rigged_by uuid REFERENCES auth.users,
  win_chance float NOT NULL DEFAULT 0.1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rigged_users ENABLE ROW LEVEL SECURITY;

-- Create policy for owners only
CREATE POLICY "Only owners can manage rigged users"
  ON rigged_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_owner = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_owner = true
    )
  );

-- Function to check if user is rigged
CREATE OR REPLACE FUNCTION check_rigged_status(target_user_id uuid)
RETURNS float AS $$
DECLARE
  chance float;
BEGIN
  SELECT win_chance INTO chance
  FROM rigged_users
  WHERE user_id = target_user_id;
  
  RETURN COALESCE(chance, 0.5); -- Default 50% if not rigged
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rig user
CREATE OR REPLACE FUNCTION rig_user(
  target_user_id uuid,
  owner_id uuid,
  win_chance float
)
RETURNS void AS $$
BEGIN
  -- Check if user is owner
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = owner_id
    AND is_owner = true
  ) THEN
    RAISE EXCEPTION 'Only owners can rig users';
  END IF;

  -- Insert or update rig status
  INSERT INTO rigged_users (user_id, rigged_by, win_chance)
  VALUES (target_user_id, owner_id, win_chance)
  ON CONFLICT (user_id)
  DO UPDATE SET
    rigged_by = EXCLUDED.rigged_by,
    win_chance = EXCLUDED.win_chance,
    created_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;