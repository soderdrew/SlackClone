-- Create storage buckets if they don't exist
DO $$ BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
        ('avatars', 'avatars', true),
        ('attachments', 'attachments', false),
        ('workspace-icons', 'workspace-icons', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Workspace icons are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Workspace admins can upload icons" ON storage.objects;

-- Create bucket policies
-- avatars bucket policy
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid() || '/avatar.*') = name
);

-- attachments bucket policy
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated'
);

-- workspace-icons bucket policy
CREATE POLICY "Workspace icons are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'workspace-icons');

CREATE POLICY "Workspace admins can upload icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workspace-icons' AND
  auth.role() = 'authenticated'
);

-- Configure CORS for all buckets
UPDATE storage.buckets
SET allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    file_size_limit = 52428800, -- 50MB in bytes
    owner = null,
    public = CASE 
      WHEN id IN ('avatars', 'workspace-icons') THEN true 
      ELSE false 
    END
WHERE id IN ('avatars', 'attachments', 'workspace-icons'); 