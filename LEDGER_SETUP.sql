-- Ledger Table
CREATE TABLE IF NOT EXISTS ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'MYR',
    category TEXT NOT NULL,
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ledger"
ON ledger FOR ALL
USING (auth.uid() = user_id);

-- Update Profiles for Trial Tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
