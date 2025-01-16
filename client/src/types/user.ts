export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'invisible';

export interface UserPresence {
  online_at?: string;
  status: UserStatus;
  status_message?: string;
}

export interface User {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  presence?: UserPresence;
  profile?: Profile;
}

// Type for updating user status
export interface UpdateUserStatusRequest {
  status: UserStatus;
  status_message?: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  last_seen: string | null;
  status_message: string | null;
  status_emoji: string | null;
  online_at: string | null;
  bio: string | null;
} 