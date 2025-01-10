import { supabase } from '../lib/supabase';
import { User, UpdateUserStatusRequest, UserStatus } from '../types/user';

export const userService = {
  // Get all users except the current user
  async getUsers(): Promise<User[]> {
    try {
      console.log('Fetching current user...');
      const { data: currentUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error getting current user:', authError);
        throw authError;
      }

      if (!currentUser?.user) {
        console.error('No current user found');
        throw new Error('Not authenticated');
      }

      console.log('Current user:', currentUser.user.id);
      
      console.log('Fetching users from profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, status, status_message, online_at')
        .neq('id', currentUser.user.id)
        .order('username');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Fetched users:', data?.length || 0);
      return data?.map(user => ({
        ...user,
        presence: {
          status: user.status as UserStatus,
          status_message: user.status_message,
          online_at: user.online_at
        }
      })) || [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  },

  // Get a specific user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      
      // Validate UUID format
      if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Invalid UUID format:', userId);
        throw new Error('Invalid user ID format');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, status, status_message, online_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error in getUserById:', error);
        throw error;
      }

      if (!data) {
        console.error('User not found:', userId);
        throw new Error('User not found');
      }

      return {
        ...data,
        presence: {
          status: data.status as UserStatus,
          status_message: data.status_message,
          online_at: data.online_at
        }
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  },

  // Update user's status and status message
  async updateUserStatus(userId: string, { status, status_message }: UpdateUserStatusRequest): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status,
          status_message,
          // online_at will be updated automatically by our trigger
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      throw error;
    }
  },

  // Get current user's status
  async getCurrentUserStatus(): Promise<{ status: UserStatus; status_message?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('status, status_message')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User profile not found');

      return {
        status: data.status as UserStatus,
        status_message: data.status_message
      };
    } catch (error) {
      console.error('Error in getCurrentUserStatus:', error);
      throw error;
    }
  },

  // Create a new user profile if it doesn't exist
  async createProfileIfNotExists(userId: string, email: string, full_name?: string): Promise<void> {
    try {
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        console.log('Profile already exists for user:', userId);
        return;
      }

      // Create new profile with default status
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            username: email.split('@')[0], // Use email prefix as username
            full_name: full_name || email.split('@')[0],
            status: 'offline', // Changed to lowercase to match existing convention
            status_message: '', // Add empty status message
            online_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        throw insertError;
      }

      console.log('Created new profile for user:', userId);
    } catch (error) {
      console.error('Error in createProfileIfNotExists:', error);
      throw error;
    }
  }
}; 