-- Drop existing tables and objects if they exist
DROP TABLE IF EXISTS public.file_uploads CASCADE;
DROP FUNCTION IF EXISTS set_file_version();
DROP FUNCTION IF EXISTS get_next_file_version();

-- Create the file_uploads table with all required columns and constraints
CREATE TABLE public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL DEFAULT 'chat_attachments',
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Composite unique constraints
    CONSTRAINT file_uploads_unique_version UNIQUE (bucket_id, storage_path, version),
    CONSTRAINT file_uploads_unique_per_chat UNIQUE (user_id, chat_id, filename, version)
);

-- Enable RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_uploads
CREATE POLICY "Users can insert their own files"
ON public.file_uploads
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own files"
ON public.file_uploads
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
ON public.file_uploads
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX file_uploads_user_id_idx ON public.file_uploads(user_id);
CREATE INDEX file_uploads_chat_id_idx ON public.file_uploads(chat_id);
CREATE INDEX file_uploads_created_at_idx ON public.file_uploads(created_at);
CREATE INDEX file_uploads_bucket_path_idx ON public.file_uploads(bucket_id, storage_path);

-- Create versioning function
CREATE OR REPLACE FUNCTION get_next_file_version(
    p_bucket_id TEXT,
    p_storage_path TEXT
) RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version), 0) + 1
    INTO next_version
    FROM public.file_uploads
    WHERE bucket_id = p_bucket_id 
    AND storage_path = p_storage_path;
    
    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Create version trigger function
CREATE OR REPLACE FUNCTION set_file_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version = 1 THEN  -- Only auto-increment if not explicitly set
        NEW.version := get_next_file_version(NEW.bucket_id, NEW.storage_path);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create version trigger
CREATE TRIGGER tr_file_version
    BEFORE INSERT ON public.file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION set_file_version();

-- Grant necessary permissions for file_uploads table
GRANT ALL ON public.file_uploads TO authenticated;
GRANT SELECT ON public.file_uploads TO public;

-- Note: Storage bucket and policies should be configured via Supabase Dashboard
-- or using the Supabase CLI/API, not through SQL migrations.
-- Create the 'chat_attachments' bucket manually in the Supabase Dashboard with:
-- - Public: true
-- - File size limit: 50MB
-- - Allowed MIME types: image/*, application/pdf 