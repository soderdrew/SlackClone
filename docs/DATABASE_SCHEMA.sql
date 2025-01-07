-- Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('online', 'offline', 'away', 'busy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('public', 'private', 'direct');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables if they don't exist
DO $$ BEGIN
    -- Users table (extends Supabase auth.users)
    CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        status user_status DEFAULT 'offline',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Workspaces table
    CREATE TABLE IF NOT EXISTS public.workspaces (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        created_by UUID REFERENCES public.profiles(id) NOT NULL
    );

    -- Workspace members table
    CREATE TABLE IF NOT EXISTS public.workspace_members (
        workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        role workspace_role DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        PRIMARY KEY (workspace_id, user_id)
    );

    -- Channels table
    CREATE TABLE IF NOT EXISTS public.channels (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        topic TEXT,
        description TEXT,
        type channel_type DEFAULT 'public',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        created_by UUID REFERENCES public.profiles(id) NOT NULL,
        UNIQUE(workspace_id, name)
    );

    -- Channel members table
    CREATE TABLE IF NOT EXISTS public.channel_members (
        channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        PRIMARY KEY (channel_id, user_id)
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS public.messages (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        is_edited BOOLEAN DEFAULT false,
        parent_id UUID REFERENCES public.messages(id), -- For thread replies
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Message reactions table
    CREATE TABLE IF NOT EXISTS public.message_reactions (
        message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        emoji TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        PRIMARY KEY (message_id, user_id, emoji)
    );

    -- Message reads table
    CREATE TABLE IF NOT EXISTS public.message_reads (
        channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        PRIMARY KEY (channel_id, user_id)
    );

    -- Files table
    CREATE TABLE IF NOT EXISTS public.files (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        created_by UUID REFERENCES public.profiles(id) NOT NULL
    );

EXCEPTION
    WHEN others THEN null;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_channel_id_user_id ON public.message_reads(channel_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channels_workspace_id ON public.channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_files_message_id ON public.files(message_id); 