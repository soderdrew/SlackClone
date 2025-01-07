-- Drop existing policies first
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Workspace members can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Members can view private channels they belong to" ON public.channels;
DROP POLICY IF EXISTS "Members can view channel members" ON public.channel_members;
DROP POLICY IF EXISTS "Channel members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Channel members can view reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Channel members can add reactions" ON public.message_reactions;

-- Disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Workspaces policies
CREATE POLICY "Workspace members can view workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = id
    AND user_id = auth.uid()
  )
);

-- Workspace members policies
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Channels policies
CREATE POLICY "Members can view public channels"
ON public.channels FOR SELECT
TO authenticated
USING (
  type = 'public' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = channels.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can view private channels they belong to"
ON public.channels FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = id
    AND user_id = auth.uid()
  )
);

-- Channel members policies
CREATE POLICY "Members can view channel members"
ON public.channel_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Channel members can view messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = messages.channel_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their channels"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = channel_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Message reactions policies
CREATE POLICY "Channel members can view reactions"
ON public.message_reactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.channel_members cm ON m.channel_id = cm.channel_id
    WHERE m.id = message_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Channel members can add reactions"
ON public.message_reactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.channel_members cm ON m.channel_id = cm.channel_id
    WHERE m.id = message_id
    AND cm.user_id = auth.uid()
  )
); 