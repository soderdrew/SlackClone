-- Add file_attachment column to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_attachment JSONB;

-- Add constraint to ensure file_attachment has required fields when present
ALTER TABLE public.messages
ADD CONSTRAINT file_attachment_schema CHECK (
    file_attachment IS NULL OR (
        file_attachment ? 'path' AND
        file_attachment ? 'filename' AND
        file_attachment ? 'size' AND
        file_attachment ? 'mimeType'
    )
); 