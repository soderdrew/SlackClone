import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Test route to check if messages table exists
router.get('/test-messages', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error testing messages table:', error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ 
      tableExists: true,
      message: 'Messages table exists and is accessible',
      sample: data 
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a channel
router.get('/channels/:channelId/messages', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;

    // First verify the user has access to this channel
    const { data: membership } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    const { data: channel } = await supabase
      .from('channels')
      .select('type')
      .eq('id', channelId)
      .single();

    // Check if user can access the channel
    if (!channel || (!membership && channel.type === 'private')) {
      res.status(403).json({ error: 'You do not have access to this channel' });
      return;
    }

    // Get messages with user information
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
        parent_id,
        user:profiles!messages_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ messages: messages || [] });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch messages' 
    });
  }
});

// Send a new message
router.post('/messages', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, channel_id } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!content?.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    if (!channel_id) {
      res.status(400).json({ error: 'Channel ID is required' });
      return;
    }

    // Verify user has access to the channel
    const { data: membership } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', channel_id)
      .eq('user_id', userId)
      .single();

    const { data: channel } = await supabase
      .from('channels')
      .select('type')
      .eq('id', channel_id)
      .single();

    if (!channel || (!membership && channel.type === 'private')) {
      res.status(403).json({ error: 'You do not have access to this channel' });
      return;
    }

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          content,
          channel_id,
          user_id: userId,
        }
      ])
      .select(`
        *,
        user:profiles!messages_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .single();

    if (messageError) throw messageError;

    res.status(201).json({ message });
  } catch (error: any) {
    console.error('Error creating message:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create message' 
    });
  }
});

// Update a message
router.put('/messages/:messageId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!content?.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Verify user owns the message
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (!existingMessage) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (existingMessage.user_id !== userId) {
      res.status(403).json({ error: 'You can only edit your own messages' });
      return;
    }

    // Update the message
    const { data: message, error: updateError } = await supabase
      .from('messages')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .select(`
        *,
        user:profiles (
          username,
          avatar_url
        )
      `)
      .single();

    if (updateError) throw updateError;

    res.json({ message });
  } catch (error: any) {
    console.error('Error updating message:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update message' 
    });
  }
});

// Delete a message
router.delete('/messages/:messageId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    // Verify user owns the message or is channel admin
    const { data: message } = await supabase
      .from('messages')
      .select(`
        user_id,
        channel_id,
        channel_members!inner (
          role
        )
      `)
      .eq('id', messageId)
      .eq('channel_members.user_id', userId)
      .single();

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const isAdmin = message.channel_members[0]?.role === 'admin';
    if (message.user_id !== userId && !isAdmin) {
      res.status(403).json({ error: 'You can only delete your own messages or any message if you are an admin' });
      return;
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) throw deleteError;

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete message' 
    });
  }
});

export default router; 