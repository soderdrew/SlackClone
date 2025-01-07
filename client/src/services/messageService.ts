import { api } from '../lib/api';
import { Message, SendMessageData } from '../types/message';

export const messageService = {
  // Get messages for a channel
  getChannelMessages: async (channelId: string): Promise<Message[]> => {
    const response = await api.get<{ messages: Message[] }>(`/channels/${channelId}/messages`);
    return response.data.messages;
  },

  // Send a new message
  sendMessage: async (data: SendMessageData): Promise<Message> => {
    const response = await api.post<{ message: Message }>('/messages', data);
    return response.data.message;
  },

  // Update a message
  updateMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await api.put<{ message: Message }>(`/messages/${messageId}`, { content });
    return response.data.message;
  },

  // Delete a message
  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(`/messages/${messageId}`);
  },
}; 