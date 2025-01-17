-- Enable REPLICA IDENTITY FULL for avatar_documents table
ALTER TABLE public.avatar_documents REPLICA IDENTITY FULL;

-- Create function to set initial document status
CREATE OR REPLACE FUNCTION public.handle_new_document()
RETURNS TRIGGER AS $$
BEGIN
    NEW.embedding_status = 'pending';
    NEW.is_processed = FALSE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new documents
DROP TRIGGER IF EXISTS set_document_initial_status ON public.avatar_documents;
CREATE TRIGGER set_document_initial_status
    BEFORE INSERT ON public.avatar_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_document();

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.avatar_documents; 