import { api } from '../lib/api';
import { Channel, CreateChannelData } from '../types/channel';
import { ChannelMember } from '../types/channel';
import { supabase } from '../lib/supabase';

class ChannelService {
  async createChannel(data: CreateChannelData): Promise<Channel> {
    const response = await api.post<Channel>('/channels', data);
    return response.data;
  }

  async getChannels(): Promise<Channel[]> {
    const response = await api.get<{ channels: Channel[] }>('/channels');
    return response.data.channels;
  }

  async getDMChannels(): Promise<Channel[]> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Fetch DM channels with all members in a single query
      const { data: channels, error: membersError } = await supabase
        .from('channels')
        .select(`
          *,
          channel_members!inner (
            user_id,
            role,
            user:user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('type', 'direct')
        .eq('channel_members.user_id', currentUser.user.id);

      if (membersError) {
        console.error('Error details:', membersError);
        throw membersError;
      }
      if (!channels) return [];
      
      console.log('Fetched DM channels:', channels);
      
      return channels.map(channel => ({
        ...channel,
        member_count: channel.channel_members.length,
        is_member: true
      }));
    } catch (error) {
      console.error('Error fetching DM channels:', error);
      throw error;
    }
  }

  async getChannel(id: string): Promise<Channel> {
    const response = await api.get<Channel>(`/channels/${id}`);
    return response.data;
  }

  async getChannelMembers(channelId: string): Promise<ChannelMember[]> {
    const response = await api.get<ChannelMember[]>(`/channels/${channelId}/members`);
    return response.data;
  }

  async joinChannel(channelId: string): Promise<void> {
    await api.post(`/channels/${channelId}/join`);
  }

  async updateChannel(id: string, data: Partial<Channel>): Promise<Channel> {
    const response = await api.put<Channel>(`/channels/${id}`, data);
    return response.data;
  }

  async deleteChannel(id: string): Promise<void> {
    await api.delete(`/channels/${id}`);
  }

  async createDirectMessageChannel(otherUserId: string): Promise<Channel> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Validate UUID format for both users
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(currentUser.user.id) || !uuidRegex.test(otherUserId)) {
        throw new Error('Invalid user ID format');
      }

      // First, check if a DM channel already exists between these users
      const { data: existingChannels } = await supabase
        .from('channels')
        .select(`
          *,
          channel_members!inner (user_id)
        `)
        .eq('type', 'direct')
        .eq('channel_members.user_id', currentUser.user.id);

      // Find a channel where both users are members
      const existingDM = existingChannels?.find(channel => 
        channel.channel_members.some((member: any) => member.user_id === otherUserId)
      );

      if (existingDM) {
        // Fetch the existing channel with all necessary data
        const { data: channelWithMembers } = await supabase
          .from('channels')
          .select(`
            *,
            channel_members!inner (
              user_id,
              role,
              profiles:user_id (
                id,
                username,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('id', existingDM.id)
          .single();

        if (!channelWithMembers) {
          throw new Error('Failed to fetch existing DM channel');
        }

        return {
          ...channelWithMembers,
          member_count: channelWithMembers.channel_members.length,
          is_member: true
        };
      }

      // Create a new DM channel with a properly formatted name
      const channelName = `dm-${currentUser.user.id}-${otherUserId}`;
      console.log('Creating new DM channel:', channelName);

      const { data: newChannel, error } = await supabase
        .from('channels')
        .insert([
          {
            type: 'direct',
            name: channelName,
            created_by: currentUser.user.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating DM channel:', error);
        throw error;
      }

      // Add both users as channel members
      const { error: membersError } = await supabase.from('channel_members').insert([
        {
          channel_id: newChannel.id,
          user_id: currentUser.user.id,
          role: 'member'
        },
        {
          channel_id: newChannel.id,
          user_id: otherUserId,
          role: 'member'
        }
      ]);

      if (membersError) {
        console.error('Error adding channel members:', membersError);
        throw membersError;
      }

      // Return the channel with its members
      const { data: channelWithMembers, error: fetchError } = await supabase
        .from('channels')
        .select(`
          *,
          channel_members!inner (
            user_id,
            role,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', newChannel.id)
        .single();

      if (fetchError || !channelWithMembers) {
        console.error('Error fetching channel with members:', fetchError);
        throw fetchError || new Error('Failed to fetch channel with members');
      }

      return {
        ...channelWithMembers,
        member_count: channelWithMembers.channel_members.length,
        is_member: true
      };
    } catch (error) {
      console.error('Error in createDirectMessageChannel:', error);
      throw error;
    }
  }
}

export const channelService = new ChannelService(); 