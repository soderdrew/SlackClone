import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from './user';

export interface User extends SupabaseUser {
  profile?: Profile;
  username?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  full_name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
} 