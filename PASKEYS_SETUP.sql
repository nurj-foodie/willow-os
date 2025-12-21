-- WebAuthn Credentials Table
-- This table stores the public keys and metadata required for WebAuthn/Passkey authentication.
CREATE TABLE IF NOT EXISTS user_credentials (
    id TEXT PRIMARY KEY, -- Credential ID (Base64URL)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    public_key BYTEA NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_type TEXT, -- 'singleDevice' or 'multiDevice'
    backed_up BOOLEAN DEFAULT false,
    transports TEXT[], -- ['usb', 'nfc', 'ble', 'internal']
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
-- Ensuring Sarah can only manage her own passkeys.
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Sarah can see and delete her own credentials
CREATE POLICY "Users can manage their own credentials"
ON user_credentials FOR ALL
USING (auth.uid() = user_id);

-- Index for performance during login ceremonies
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);

-- Comment for clarity
COMMENT ON TABLE user_credentials IS 'Stores WebAuthn public key credentials for passkey-based logins.';
