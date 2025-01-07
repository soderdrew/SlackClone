import { api } from '../lib/api';
import { Channel, CreateChannelData } from '../types/channel';

export const channelService = {
  createChannel: async (data: CreateChannelData): Promise<Channel> => {
    const response = await api.post<{ channel: Channel }>('/channels', data);
    return response.data.channel;
  },

  getChannels: async (): Promise<Channel[]> => {
    const response = await api.get<{ channels: Channel[] }>('/channels');
    return response.data.channels;
  },

  getChannel: async (id: string): Promise<Channel> => {
    const response = await api.get<{ channel: Channel }>(`/channels/${id}`);
    return response.data.channel;
  },

  updateChannel: async (id: string, data: Partial<CreateChannelData>): Promise<Channel> => {
    const response = await api.put<{ channel: Channel }>(`/channels/${id}`, data);
    return response.data.channel;
  },

  deleteChannel: async (id: string): Promise<void> => {
    await api.delete(`/channels/${id}`);
  },
}; 