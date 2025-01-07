import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all channels
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // First, get all public channels
    const { data: publicChannels, error: publicError } = await supabase
      .from('channels')
      .select(`
        *,
        channel_members!left (
          user_id
        )
      `)
      .eq('type', 'public');

    if (publicError) throw publicError;

    // Then, get private channels where user is a member
    const { data: privateChannels, error: privateError } = await supabase
      .from('channels')
      .select(`
        *,
        channel_members!inner (
          user_id
        )
      `)
      .eq('type', 'private')
      .eq('channel_members.user_id', userId);

    if (privateError) throw privateError;

    // Combine and format channels
    const allChannels = [...(publicChannels || []), ...(privateChannels || [])];
    const formattedChannels = allChannels.map(channel => ({
      ...channel,
      is_member: channel.channel_members?.some((member: any) => member.user_id === userId) || false,
      member_count: channel.channel_members?.length || 0
    }));

    res.json({ channels: formattedChannels });
  } catch (error: any) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch channels' 
    });
  }
});

// Create a new channel
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, type = 'public' } = req.body;
    const userId = req.user?.id;

    // Validate channel name
    if (!name) {
      res.status(400).json({ error: 'Channel name is required' });
      return;
    }

    // Channel name should be lowercase, numbers, and hyphens only
    const nameRegex = /^[a-z0-9-]+$/;
    if (!nameRegex.test(name)) {
      res.status(400).json({ 
        error: 'Channel name can only contain lowercase letters, numbers, and hyphens' 
      });
      return;
    }

    // Check if channel name already exists
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('name')
      .eq('name', name)
      .single();

    if (existingChannel) {
      res.status(400).json({ error: 'Channel name already exists' });
      return;
    }

    // Create the channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert([
        {
          name,
          description,
          type,
          created_by: userId,
        }
      ])
      .select('*')
      .single();

    if (channelError) throw channelError;

    // Add creator as channel member with admin role
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert([
        {
          channel_id: channel.id,
          user_id: userId,
          role: 'admin',
        }
      ]);

    if (memberError) throw memberError;

    // Return the created channel
    res.status(201).json({
      channel: {
        ...channel,
        member_count: 1,
        is_member: true,
      }
    });
  } catch (error: any) {
    console.error('Channel creation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create channel' 
    });
  }
});

export default router; 