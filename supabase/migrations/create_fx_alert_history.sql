-- Create FX Alert History table
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS fx_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  currency TEXT NOT NULL,
  target_rate DECIMAL(10, 2) NOT NULL,
  current_rate DECIMAL(10, 2) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_fx_alert_history_user_currency ON fx_alert_history(user_id, currency);
CREATE INDEX idx_fx_alert_history_triggered_at ON fx_alert_history(triggered_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE fx_alert_history ENABLE ROW LEVEL SECURITY;

-- Grants for PostgREST (anon/authenticated)
GRANT SELECT, INSERT ON TABLE fx_alert_history TO anon, authenticated;

-- Allow users to see their own alert history
DROP POLICY IF EXISTS "Users can view their own alert history" ON fx_alert_history;
CREATE POLICY "Users can view their own alert history" ON fx_alert_history
  FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Allow users to insert their own alerts
DROP POLICY IF EXISTS "Users can insert their own alert history" ON fx_alert_history;
CREATE POLICY "Users can insert their own alert history" ON fx_alert_history
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);
