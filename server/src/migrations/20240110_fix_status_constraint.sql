-- Create an enum type for user status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ONLINE', 'OFFLINE', 'AWAY', 'BUSY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Temporarily alter any existing invalid status values to 'OFFLINE'
UPDATE profiles 
SET status = 'OFFLINE' 
WHERE status IS NULL OR status NOT IN ('ONLINE', 'OFFLINE', 'AWAY', 'BUSY');

-- Convert the status column from text to enum
ALTER TABLE profiles 
    ALTER COLUMN status TYPE user_status 
    USING CASE 
        WHEN status IS NULL THEN 'OFFLINE'::user_status
        ELSE status::user_status 
    END;

-- Set default value for future rows
ALTER TABLE profiles 
    ALTER COLUMN status SET DEFAULT 'OFFLINE'::user_status; 