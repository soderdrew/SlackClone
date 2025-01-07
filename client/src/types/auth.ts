import { User as SupabaseUser } from '@supabase/supabase-js';

export type User = SupabaseUser;

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