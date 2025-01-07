import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: email,
          full_name: full_name,
          username: email.split('@')[0], // Default username from email
        }
      ]);

    if (profileError) throw profileError;

    // Add user to default channels
    await addToDefaultChannels(authData.user.id);

    res.json({ 
      message: 'Signup successful. Please check your email for verification.',
      user: authData.user 
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    res.json({ 
      message: 'Login successful',
      session: data.session,
      user: {
        ...data.user,
        profile,
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    res.json({ message: 'Signed out successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Password reset request
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`,
    });

    if (error) throw error;

    res.json({ message: 'Password reset instructions sent to email' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update password
router.post('/update-password', async (req, res) => {
  try {
    const { new_password } = req.body;
    
    const { error } = await supabase.auth.updateUser({
      password: new_password
    });

    if (error) throw error;

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// After successful registration, add user to default channels
const addToDefaultChannels = async (userId: string) => {
  try {
    // Get default channels (general and random)
    const { data: defaultChannels } = await supabase
      .from('channels')
      .select('id, name')
      .in('name', ['general', 'random']);

    if (!defaultChannels?.length) return;

    // Add user to each default channel
    for (const channel of defaultChannels) {
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert([
          {
            channel_id: channel.id,
            user_id: userId,
            role: 'member'
          }
        ]);

      if (memberError) {
        console.error(`Error adding user to channel ${channel.id}:`, memberError);
        continue;
      }

      // Add welcome message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            channel_id: channel.id,
            user_id: userId,
            content: `<@${userId}> joined #${channel.name}`,
            is_system_message: true
          }
        ]);

      if (messageError) {
        console.error(`Error creating welcome message in channel ${channel.id}:`, messageError);
      }
    }
  } catch (error) {
    console.error('Error adding user to default channels:', error);
  }
};

export default router; 