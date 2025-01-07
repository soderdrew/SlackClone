import { supabase } from '../lib/supabase';

interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

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
        .select('id, username, full_name, avatar_url')
        .neq('id', currentUser.user.id)
        .order('username');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Fetched users:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  },

  // Get a specific user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      console.log('Fetching user by ID:', userId);
      
      // Validate UUID format
      if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Invalid UUID format:', userId);
        throw new Error('Invalid user ID format');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
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

      console.log('Successfully fetched user:', data.username);
      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  }
}; 