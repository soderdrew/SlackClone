-- First, let's check the current constraint
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'valid_status';

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_status;

-- Add the updated constraint with 'invisible' status
ALTER TABLE profiles
ADD CONSTRAINT valid_status 
CHECK (status = ANY (ARRAY['online'::text, 'offline'::text, 'away'::text, 'busy'::text, 'invisible'::text])); 