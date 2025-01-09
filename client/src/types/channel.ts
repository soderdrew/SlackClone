import { User } from './user';

export type ChannelType = 'public' | 'private' | 'direct';

interface ChannelMemberProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export interface ChannelMember {
  id?: string;
  user_id?: string;
  channel_id: string;
  username?: string;
  avatar_url?: string;
  role?: 'admin' | 'member';
  joined_at?: string;
  user?: User;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by: string;
  created_at: string;
  is_member?: boolean;
  member_count?: number;
  channel_members?: ChannelMember[];
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