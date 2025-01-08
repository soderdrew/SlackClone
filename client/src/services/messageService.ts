import { supabase } from '../lib/supabase';
import { Message, SendMessageData } from '../types/message';
import { fileService } from './fileService';

interface MessageRow {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  file_attachment?: {
    path: string;
    filename: string;
    size: number;
    mimeType: string;
  };
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

class MessageService {
  // Helper method to check if a channel is a DM channel
  private isDMChannel(channelId: string): boolean {
    return channelId.startsWith('dm-');
  }

  // Helper method to get user profile fields
  private get userProfileFields(): string {
    return `
      id,
      username,
      full_name,
      avatar_url
    `;
  }

  async getChannelMessages(channelId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        channel_id,
        user_id,
        created_at,
        updated_at,
        is_edited,
        file_attachment,
        user:profiles (
          ${this.userProfileFields}
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', {
        channelId,
        error,
        isDM: this.isDMChannel(channelId)
      });
      throw error;
    }

    return (data || []) as unknown as Message[];
  }

  async sendMessage(messageData: SendMessageData): Promise<Message> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    let fileAttachment = null;
    if (messageData.file) {
      fileAttachment = await fileService.uploadFile(messageData.file);
    }

    console.log('Sending message:', {
      channelId: messageData.channel_id,
      isDM: this.isDMChannel(messageData.channel_id),
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: messageData.content,
        channel_id: messageData.channel_id,
        user_id: userData.user.id,
        file_attachment: fileAttachment
      })
      .select(`
        id,
        content,
        channel_id,
        user_id,
        created_at,
        updated_at,
        is_edited,
        file_attachment,
        user:profiles (
          ${this.userProfileFields}
        )
      `)
      .single();

    if (error) {
      console.error('Error sending message:', {
        channelId: messageData.channel_id,
        error,
        isDM: this.isDMChannel(messageData.channel_id)
      });
      throw error;
    }

    return data as unknown as Message;
  }

  async updateMessage(messageId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update({ content, is_edited: true })
      .eq('id', messageId)
      .select(`
        id,
        content,
        channel_id,
        user_id,
        created_at,
        updated_at,
        is_edited,
        file_attachment,
        user:profiles (
          ${this.userProfileFields}
        )
      `)
      .single();

    if (error) throw error;
    return data as unknown as Message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    // First get the message to check for file attachment
    const { data: message } = await supabase
      .from('messages')
      .select('file_attachment')
      .eq('id', messageId)
      .single();

    // If there's a file attachment, delete it first
    if (message?.file_attachment?.path) {
      await fileService.deleteFile(message.file_attachment.path);
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }

  // New method to get the latest DM for each unique conversation
  async getLatestDMs(): Promise<{ [key: string]: Message }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    // Get all DM channels for the current user
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
        file_attachment,
        user:profiles (
          ${this.userProfileFields}
        )
      `)
      .like('channel_id', 'dm-%')
      .or(`user_id.eq.${userData.user.id},channel_id.like.%${userData.user.id}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by channel and get the latest message
    const latestMessages: { [key: string]: Message } = {};
    const typedMessages = (messages || []) as unknown as MessageRow[];
    
    typedMessages.forEach((message) => {
      const channelId = message.channel_id;
      if (!latestMessages[channelId]) {
        latestMessages[channelId] = message as Message;
      }
    });

    return latestMessages;
  }

  // Method to get or create a DM channel between two users
  async getOrCreateDMChannel(otherUserId: string): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const currentUserId = userData.user.id;
    
    // Create consistent channel ID format
    const userIds = [currentUserId, otherUserId].sort();
    const channelId = `dm-${userIds[0]}-${userIds[1]}`;

    console.log('Getting or creating DM channel:', {
      channelId,
      currentUserId,
      otherUserId,
      timestamp: new Date().toISOString()
    });

    return channelId;
  }
}

export const messageService = new MessageService(); 