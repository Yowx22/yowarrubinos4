/*
  # Create wallets table

  1. New Tables
    - `wallets`
      - `user_id` (uuid, primary key, references users.id)
      - `balance` (integer, default 0)
      - `level` (integer, default 1)
      - `last_reward_claim` (timestamptz, nullable)
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `wallets` table
    - Add policies for authenticated users to:
      - Read their own wallet
      - Update their own wallet through RPC functions only
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  last_reward_claim TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own wallet"
  ON public.wallets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy to prevent direct updates (must use RPC functions)
CREATE POLICY "Users cannot directly modify wallets"
  ON public.wallets
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_timestamp
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();

-- Create function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(target_user_id UUID, amount_change INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (target_user_id, amount_change)
  ON CONFLICT (user_id) 
  DO UPDATE SET balance = wallets.balance + amount_change;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;