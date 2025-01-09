-- Check current REPLICA IDENTITY setting
SELECT relname, relreplident 
FROM pg_class 
WHERE relname = 'profiles';

-- Enable full REPLICA IDENTITY for the profiles table
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- Remove the table from the publication (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE profiles;
    END IF;
END $$;

-- Add the table back to the publication with ALL columns
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Verify the publication setup
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'profiles'; 