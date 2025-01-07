import { api } from '../lib/api';
import { Channel, CreateChannelData } from '../types/channel';
import { ChannelMember } from '../types/channel';

class ChannelService {
  async createChannel(data: CreateChannelData): Promise<Channel> {
    const response = await api.post<Channel>('/channels', data);
    return response.data;
  }

  async getChannels(): Promise<Channel[]> {
    const response = await api.get<{ channels: Channel[] }>('/channels');
    return response.data.channels;
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
}

export const channelService = new ChannelService(); 