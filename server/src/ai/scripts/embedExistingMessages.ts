import { supabase } from '../../config/supabase';
import { embedMessages } from '../services/embedding';
import { EmbeddingMetadata } from '../types';

async function fetchAllMessages() {
  try {
    console.log('Fetching all messages from Supabase...');
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        channel_id,
        user_id,
        created_at,
        updated_at,
        is_edited,
        type,
        file_attachment
      `)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`Found ${messages?.length || 0} messages to embed`);
    return messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

async function embedExistingMessages() {
  try {
    // 1. Fetch all messages
    const messages = await fetchAllMessages();

    // 2. Convert to EmbeddingMetadata format
    const messagesToEmbed: EmbeddingMetadata[] = messages.map(msg => ({
      messageId: msg.id,
      channelId: msg.channel_id,
      userId: msg.user_id,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      content: msg.content,
      isEdited: msg.is_edited || false,
      messageType: msg.type || 'message',
      hasAttachment: !!msg.file_attachment
    }));

    // 3. Process in batches to avoid rate limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < messagesToEmbed.length; i += BATCH_SIZE) {
      const batch = messagesToEmbed.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(messagesToEmbed.length / BATCH_SIZE)}`);
      
      await embedMessages(batch);
      
      // Add a small delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Successfully embedded all existing messages!');
  } catch (error) {
    console.error('Error in embedExistingMessages:', error);
    throw error;
  }
}

// Run the script
embedExistingMessages()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 