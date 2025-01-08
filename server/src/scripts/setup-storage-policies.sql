-- Enable Storage policies
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'message-attachments' AND
    auth.role() = 'authenticated'
);

-- Allow users to read any file from messages they can access
CREATE POLICY "Allow users to read files from accessible messages"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'message-attachments' AND
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.channel_members cm ON cm.channel_id = m.channel_id
        WHERE 
            m.file_attachment->>'path' = storage.objects.name
            AND cm.user_id = auth.uid()
    )
);

-- Allow users to delete their own uploaded files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'message-attachments' AND
    EXISTS (
        SELECT 1 FROM public.messages m
        WHERE 
            m.file_attachment->>'path' = storage.objects.name
            AND m.user_id = auth.uid()
    )
); 