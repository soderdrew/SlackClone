import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

interface ChannelMember {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'member';
}

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

// Get channel members
router.get('/:channelId/members', authenticateToken, async (req: Request, res: Response): Promise<void> => {
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

    // Get channel members with user information
    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        user_id,
        role,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('channel_id', channelId);

    if (error) throw error;

    // Safely type and transform the data
    const members = data as unknown as Array<{
      role: 'admin' | 'member';
      profiles: Profile;
    }>;

    // Format the response
    const formattedMembers: ChannelMember[] = members?.map(member => ({
      id: member.profiles.id,
      username: member.profiles.username,
      full_name: member.profiles.full_name,
      avatar_url: member.profiles.avatar_url,
      role: member.role
    })) || [];

    res.json(formattedMembers);
  } catch (error: any) {
    console.error('Error fetching channel members:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch channel members' 
    });
  }
});

// Join a channel
router.post('/:channelId/join', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;

    // Check if channel exists and is public
    const { data: channel } = await supabase
      .from('channels')
      .select('type')
      .eq('id', channelId)
      .single();

    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    if (channel.type !== 'public') {
      res.status(403).json({ error: 'Cannot join private channels directly' });
      return;
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      // If already a member, just return success
      res.status(200).json({ message: 'Already a member of this channel' });
      return;
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert([
        {
          channel_id: channelId,
          user_id: userId,
          role: 'member'
        }
      ]);

    if (memberError) throw memberError;

    // Create system message about user joining
    const { error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          channel_id: channelId,
          user_id: userId,
          content: `<@${userId}> joined the channel`,
          type: 'system' // Using type instead of is_system_message
        }
      ]);

    if (messageError) {
      console.error('Error creating system message:', messageError);
    }

    res.status(200).json({ message: 'Successfully joined channel' });
  } catch (error: any) {
    console.error('Error joining channel:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to join channel' 
    });
  }
});

export default router; 