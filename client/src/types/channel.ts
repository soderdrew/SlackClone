export type ChannelType = 'public' | 'private' | 'direct';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  created_at: string;
  created_by: string;
  member_count: number;
  is_member?: boolean;
}

export interface ChannelMember {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'member';
}

export interface CreateChannelData {
  name: string;
  description?: string;
  type: ChannelType;
  members?: string[]; // Array of user IDs
}

export interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
} 