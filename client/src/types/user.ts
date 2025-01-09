export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'invisible';

export interface UserPresence {
  online_at?: string;
  status: UserStatus;
  status_message?: string;
}

export interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  presence?: UserPresence;
}

// Type for updating user status
export interface UpdateUserStatusRequest {
  status: UserStatus;
  status_message?: string;
} 