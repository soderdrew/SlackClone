import { supabase } from '../config/supabase';

async function setupDefaultChannels() {
  try {
    // Get or create the default channels
    const defaultChannels = [
      { name: 'general', description: 'General discussion' },
      { name: 'random', description: 'Random conversations' }
    ];

    console.log('Setting up default channels...');

    for (const channelData of defaultChannels) {
      // Check if channel exists
      const { data: existingChannel } = await supabase
        .from('channels')
        .select('*')
        .eq('name', channelData.name)
        .single();

      let channelId: string;

      if (!existingChannel) {
        // Create the channel
        const { data: newChannel, error: channelError } = await supabase
          .from('channels')
          .insert([{
            name: channelData.name,
            description: channelData.description,
            type: 'public'
          }])
          .select()
          .single();

        if (channelError) throw channelError;
        channelId = newChannel.id;
        console.log(`Created ${channelData.name} channel`);
      } else {
        channelId = existingChannel.id;
        console.log(`${channelData.name} channel already exists`);
      }

      // Check if channel has any admin
      const { data: admins } = await supabase
        .from('channel_members')
        .select('user_id')
        .eq('channel_id', channelId)
        .eq('role', 'admin');

      if (!admins || admins.length === 0) {
        // Get the first user from profiles to make them admin
        const { data: firstUser } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .single();

        if (firstUser) {
          // Add them as admin
          const { error: memberError } = await supabase
            .from('channel_members')
            .insert([{
              channel_id: channelId,
              user_id: firstUser.id,
              role: 'admin'
            }]);

          if (memberError) throw memberError;
          console.log(`Added admin to ${channelData.name} channel`);
        }
      } else {
        console.log(`${channelData.name} channel already has admin(s)`);
      }
    }

    console.log('Default channels setup complete!');
  } catch (error) {
    console.error('Error setting up default channels:', error);
  }
}

// Run the script
setupDefaultChannels(); 