-- Drop existing avatar document policies if they exist
DROP POLICY IF EXISTS "Allow users to upload their own avatar documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own avatar documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatar documents" ON storage.objects;

-- Create new policies for avatar documents
CREATE POLICY "Allow users to upload their own avatar documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid() || '/.*') = name
);

-- Allow users to read their own avatar documents
CREATE POLICY "Allow users to read their own avatar documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'avatars' AND
    EXISTS (
        SELECT 1 FROM public.avatar_documents ad
        WHERE 
            ad.storage_path = storage.objects.name
            AND ad.user_id = auth.uid()
    )
);

-- Allow users to delete their own avatar documents
CREATE POLICY "Allow users to delete their own avatar documents"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars' AND
    EXISTS (
        SELECT 1 FROM public.avatar_documents ad
        WHERE 
            ad.storage_path = storage.objects.name
            AND ad.user_id = auth.uid()
    )
);

-- Update bucket configuration for avatar documents
UPDATE storage.buckets
SET allowed_mime_types = array[
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/json',
    'text/csv'
],
file_size_limit = 10485760  -- 10MB in bytes
WHERE id = 'avatars'; 