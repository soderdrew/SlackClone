import { supabase } from '../config/supabase';

async function createProfile(userId: string, email: string) {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingProfile) {
      console.log('Profile already exists');
      return;
    }

    // Create profile with required fields
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          username: email.split('@')[0],
          full_name: 'Drew Soder',
          avatar_url: '',
          status: 'offline',
        }
      ]);

    if (insertError) throw insertError;

    console.log('Profile created successfully');
  } catch (error) {
    console.error('Error creating profile:', error);
  }
}

// Get these values from your Supabase authentication
const USER_ID = 'bf42cf64-bf0b-4df9-84c4-a8b5d9251b60';
const USER_EMAIL = 'soderdrews@gmail.com';

createProfile(USER_ID, USER_EMAIL); 