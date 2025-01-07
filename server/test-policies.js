const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testRLSDisabled() {
  console.log('Testing if RLS is disabled (using Bob as test user)...');
  
  // Sign in as Bob (regular member)
  const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'bob@test.com',
    password: 'test'
  });

  if (signInError) {
    console.error('Error signing in as Bob:', signInError);
    return;
  }
  console.log('Successfully signed in as Bob');

  // Test 1: Bob should now see ALL workspace members
  const { data: members, error: membersError } = await supabase
    .from('workspace_members')
    .select(`
      role,
      profiles:user_id (
        username,
        full_name
      )
    `);
  
  console.log('\nWorkspace Members Test:');
  if (membersError) {
    console.error('Error fetching workspace members:', membersError);
  } else {
    console.log('Workspace members visible:', members?.length || 0, 'members found');
    console.log('Members:', members);
  }

  // Test 2: Bob should see ALL channels (including private ones)
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*');
  
  console.log('\nChannels Test:');
  if (channelsError) {
    console.error('Error fetching channels:', channelsError);
  } else {
    console.log('Channels visible:', channels?.length || 0, 'channels found');
    console.log('Channels:', channels);
  }

  // Test 3: Bob should see ALL messages (including from private channels)
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      content,
      profiles:user_id (
        username
      ),
      channels:channel_id (
        name,
        type
      )
    `);
  
  console.log('\nMessages Test:');
  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
  } else {
    console.log('Messages visible:', messages?.length || 0, 'messages found');
    console.log('Messages:', messages);
  }
}

testRLSDisabled().catch(console.error); 