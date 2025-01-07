import { supabase } from '../lib/supabase';
import { Message, SendMessageData } from '../types/message';

class MessageService {
  async getChannelMessages(channelId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:user_id (
          id,
          username,
          full_name
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  }

  async sendMessage(messageData: SendMessageData): Promise<Message> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...messageData,
        user_id: userData.user.id
      })
      .select(`
        *,
        user:user_id (
          id,
          username,
          full_name
        )
      `)
      .single();

    if (error) throw error;
    return data as Message;
  }

  async updateMessage(messageId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update({ content, is_edited: true })
      .eq('id', messageId)
      .select(`
        *,
        user:user_id (
          id,
          username,
          full_name
        )
      `)
      .single();

    if (error) throw error;
    return data as Message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }
}

export const messageService = new MessageService(); 