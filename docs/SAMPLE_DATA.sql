-- First, let's create some test users using Supabase Auth
-- Note: Replace these UUIDs with actual user IDs after creating users in Supabase Auth UI
INSERT INTO public.profiles (id, username, full_name, status)
VALUES
  ('0aa62d0c-ebcd-494b-927c-20f89a0a1d5d', 'alice', 'Alice Johnson', 'online'),
  ('cb06ea44-c541-4845-80f3-11a8ffd9a336', 'bob', 'Bob Smith', 'online'),
  ('de38c9e0-024f-443d-8832-bb25bf5393c0', 'carol', 'Carol Williams', 'offline');

-- Create a test workspace
INSERT INTO public.workspaces (id, name, slug, created_by)
VALUES (
  '11b95e3d-7682-4f96-9fb5-c8f4cf1c0423',
  'Test Workspace',
  'test-workspace',
  'de38c9e0-024f-443d-8832-bb25bf5393c0'
);

-- Add members to the workspace
INSERT INTO public.workspace_members (workspace_id, user_id, role)
VALUES
  ('11b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'de38c9e0-024f-443d-8832-bb25bf5393c0', 'owner'),
  ('11b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '0aa62d0c-ebcd-494b-927c-20f89a0a1d5d', 'admin'),
  ('11b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'cb06ea44-c541-4845-80f3-11a8ffd9a336', 'member');

-- Create some channels
INSERT INTO public.channels (id, workspace_id, name, topic, type, created_by)
VALUES
  ('c1b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '11b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'general', 'General discussions', 'public', 'de38c9e0-024f-443d-8832-bb25bf5393c0'),
  ('c2b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '11b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'random', 'Random chatter', 'public', 'de38c9e0-024f-443d-8832-bb25bf5393c0'),
  ('c3b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '11b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'private-channel', 'Confidential stuff', 'private', 'de38c9e0-024f-443d-8832-bb25bf5393c0');

-- Add members to channels
INSERT INTO public.channel_members (channel_id, user_id)
VALUES
  -- Everyone in general
  ('c1b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'de38c9e0-024f-443d-8832-bb25bf5393c0'),
  ('c1b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '0aa62d0c-ebcd-494b-927c-20f89a0a1d5d'),
  ('c1b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'cb06ea44-c541-4845-80f3-11a8ffd9a336'),
  -- Everyone in random
  ('c2b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'de38c9e0-024f-443d-8832-bb25bf5393c0'),
  ('c2b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '0aa62d0c-ebcd-494b-927c-20f89a0a1d5d'),
  ('c2b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'cb06ea44-c541-4845-80f3-11a8ffd9a336'),
  -- Only Carol and Alice in private channel
  ('c3b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'de38c9e0-024f-443d-8832-bb25bf5393c0'),
  ('c3b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '0aa62d0c-ebcd-494b-927c-20f89a0a1d5d');

-- Add some messages
INSERT INTO public.messages (id, channel_id, user_id, content)
VALUES
  -- Messages in general
  ('21b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'c1b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'de38c9e0-024f-443d-8832-bb25bf5393c0', 'Welcome to the general channel!'),
  ('22b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'c1b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '0aa62d0c-ebcd-494b-927c-20f89a0a1d5d', 'Thanks for having me!'),
  -- Messages in random
  ('23b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'c2b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'cb06ea44-c541-4845-80f3-11a8ffd9a336', 'Anyone up for lunch?'),
  -- Messages in private channel
  ('24b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'c3b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'de38c9e0-024f-443d-8832-bb25bf5393c0', 'This is a private message');

-- Add some reactions
INSERT INTO public.message_reactions (message_id, user_id, emoji)
VALUES
  ('21b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '0aa62d0c-ebcd-494b-927c-20f89a0a1d5d', '👋'),
  ('23b95e3d-7682-4f96-9fb5-c8f4cf1c0423', 'de38c9e0-024f-443d-8832-bb25bf5393c0', '🍕'); 