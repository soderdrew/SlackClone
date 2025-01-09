-- Add presence columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('online', 'offline', 'away', 'busy', 'invisible')) DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS status_message text,
ADD COLUMN IF NOT EXISTS online_at timestamp with time zone;

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Create a function to update online_at timestamp
CREATE OR REPLACE FUNCTION update_online_at()
RETURNS trigger AS $$
BEGIN
    IF NEW.status != 'offline' AND (OLD.status = 'offline' OR OLD.status IS NULL) THEN
        NEW.online_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update online_at
DROP TRIGGER IF EXISTS update_profile_online_at ON profiles;
CREATE TRIGGER update_profile_online_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_online_at(); 