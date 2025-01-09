import { api } from '../lib/api';
import { Channel, CreateChannelData } from '../types/channel';
import { ChannelMember } from '../types/channel';
import { supabase } from '../lib/supabase';
import { UserStatus } from '../types/user';

interface RawChannelMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  profiles: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface MemberResponse {
  user_id: string;
  role: 'admin' | 'member';
  profiles: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

class ChannelService {
  async createChannel(data: CreateChannelData): Promise<Channel> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Create the channel
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert([
          {
            name: data.name,
            description: data.description,
            type: data.type,
            created_by: userData.user.id
          }
        ])
        .select(`
          *,
          channel_members (
            user_id,
            role
          )
        `)
        .single();

      if (channelError) throw channelError;

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert([
          {
            channel_id: channel.id,
            user_id: userData.user.id,
            role: 'admin'
          }
        ]);

      if (memberError) throw memberError;

      // Fetch the complete channel data with members
      const { data: fullChannel, error: fetchError } = await supabase
        .from('channels')
        .select(`
          *,
          channel_members (
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
        .eq('id', channel.id)
        .single();

      if (fetchError || !fullChannel) throw fetchError;

      // Return the channel with additional fields
      return {
        ...fullChannel,
        member_count: fullChannel.channel_members?.length || 1,
        is_member: true
      };
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
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

      if (membersError) throw membersError;
      if (!channels) return [];
      
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
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Fetch channel with members
      const { data: channel, error } = await supabase
        .from('channels')
        .select(`
          *,
          channel_members (
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
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!channel) throw new Error('Channel not found');

      // Check if the current user is a member
      const isMember = channel.channel_members.some(
        (member: { user_id: string }) => member.user_id === userData.user.id
      );

      return {
        ...channel,
        member_count: channel.channel_members.length,
        is_member: isMember
      };
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  }

  async getChannelMembers(channelId: string): Promise<ChannelMember[]> {
    try {
      // Get channel members with their profile information
      const { data, error } = await supabase
        .from('channel_members')
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            status,
            status_message,
            online_at
          )
        `)
        .eq('channel_id', channelId);

      if (error) throw error;
      if (!data) return [];

      // Transform the data to match our expected type
      return data.map(member => {
        // First cast to unknown, then to the expected type
        const profile = (member.profiles as unknown) as {
          id: string;
          username: string;
          full_name?: string;
          avatar_url?: string;
          status?: UserStatus;
          status_message?: string;
          online_at?: string;
        };

        return {
          id: profile.id,
          user_id: member.user_id,
          channel_id: channelId,
          role: member.role as 'admin' | 'member',
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          user: {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            presence: {
              status: (profile.status as UserStatus) || 'offline',
              status_message: profile.status_message,
              online_at: profile.online_at
            }
          }
        };
      });
    } catch (error) {
      console.error('Error in getChannelMembers:', error);
      throw error;
    }
  }

  async joinChannel(channelId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Add the user as a member
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert([
          {
            channel_id: channelId,
            user_id: userData.user.id,
            role: 'member'
          }
        ]);

      if (memberError) {
        // If the error is because they're already a member, that's fine
        if (memberError.code === '23505') { // Unique constraint violation
          return;
        }
        throw memberError;
      }

      // Create a system message announcing the join
      const { error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            channel_id: channelId,
            user_id: userData.user.id,
            content: `<@${userData.user.id}> joined the channel`,
            is_system_message: true
          }
        ]);

      // Don't throw if system message fails, just log it
      if (messageError) {
        console.error('Error creating system message:', messageError);
      }
    } catch (error) {
      console.error('Error joining channel:', error);
      throw error;
    }
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