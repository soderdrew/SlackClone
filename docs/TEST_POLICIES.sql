-- Test 1: Bob trying to view channels (should only see public ones)
select auth.uid() as current_user; -- Verify we're Bob
select * from channels;

-- Test 2: Bob trying to view private channel messages (should return nothing)
select * from messages where channel_id = 'c3b95e3d-7682-4f96-9fb5-c8f4cf1c0423';

-- Test 3: Alice viewing all channels (should see both public and private)
select auth.uid() as current_user; -- Verify we're Alice
select * from channels;

-- Test 4: Carol (owner) viewing workspace members
select auth.uid() as current_user; -- Verify we're Carol
select 
    wm.role,
    p.username,
    p.full_name
from workspace_members wm
join profiles p on p.id = wm.user_id
where wm.workspace_id = '11b95e3d-7682-4f96-9fb5-c8f4cf1c0423';

-- Test 5: Try to view messages in general channel (everyone should see these)
select 
    m.content,
    p.username as sender,
    to_char(m.created_at, 'YYYY-MM-DD HH24:MI:SS') as sent_at
from messages m
join profiles p on p.id = m.user_id
where m.channel_id = 'c1b95e3d-7682-4f96-9fb5-c8f4cf1c0423'
order by m.created_at;

-- Test 6: Check reactions on messages
select 
    m.content as message_content,
    p1.username as message_sender,
    p2.username as reaction_by,
    mr.emoji
from messages m
join message_reactions mr on m.id = mr.message_id
join profiles p1 on m.user_id = p1.id
join profiles p2 on mr.user_id = p2.id
where m.id in ('21b95e3d-7682-4f96-9fb5-c8f4cf1c0423', '23b95e3d-7682-4f96-9fb5-c8f4cf1c0423'); 