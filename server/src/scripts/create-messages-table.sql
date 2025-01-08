-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    channel_id UUID NOT NULL REFERENCES public.channels(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    file_attachment JSONB,
    CONSTRAINT file_attachment_schema CHECK (
        file_attachment IS NULL OR (
            file_attachment ? 'path' AND
            file_attachment ? 'filename' AND
            file_attachment ? 'size' AND
            file_attachment ? 'mimeType'
        )
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_channel_id_idx ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Set up Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable real-time for this table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Create policies
-- Users can view messages in public channels or private channels they're members of
CREATE POLICY "Users can view messages in accessible channels" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.channels c
            LEFT JOIN public.channel_members cm ON cm.channel_id = c.id AND cm.user_id = auth.uid()
            WHERE c.id = messages.channel_id
            AND (c.type = 'public' OR cm.user_id IS NOT NULL)
        )
    );

-- Users can insert messages in channels they're members of
CREATE POLICY "Users can insert messages in their channels" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_id = messages.channel_id
            AND user_id = auth.uid()
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Users can delete their own messages or any message if they're channel admin
CREATE POLICY "Users can delete their own messages or if admin" ON public.messages
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_id = messages.channel_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create function to update updated_at and is_edited
CREATE OR REPLACE FUNCTION public.handle_message_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    NEW.is_edited = TRUE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at and is_edited
CREATE TRIGGER set_message_update_fields
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    WHEN (OLD.content IS DISTINCT FROM NEW.content)
    EXECUTE FUNCTION public.handle_message_update();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 