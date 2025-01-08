import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    console.log('Starting signup process for:', email);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          pending_username: email.split('@')[0],
        },
        emailRedirectTo: new URL('/confirm-email', process.env.CLIENT_URL || 'http://localhost:5173').toString(),
      },
    });

    console.log('Signup response:', {
      authData: {
        ...authData,
        user: {
          ...authData.user,
          confirmation_sent_at: authData.user?.confirmation_sent_at,
          email_confirmed_at: authData.user?.email_confirmed_at,
        }
      },
      authError
    });

    if (authError) {
      console.error('Auth error during signup:', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('No user data returned from signup');
      throw new Error('Failed to create user');
    }

    console.log('User created successfully:', authData.user.id);

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

    console.log('User metadata:', data.user.user_metadata);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      console.log('Creating new profile for user:', data.user.id);
      
      // Create default values if metadata is missing
      const username = email.split('@')[0];
      const fullName = data.user.user_metadata?.full_name || username;

      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            full_name: fullName,
            username: username,
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        throw createError;
      }

      console.log('Created new profile:', newProfile);

      // Add user to default channels
      await addToDefaultChannels(data.user.id);

      res.json({ 
        message: 'Login successful',
        session: data.session,
        user: {
          ...data.user,
          profile: newProfile,
        }
      });
      return;
    }

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
    console.error('Signin error:', error);
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
    // Get the general channel
    const { data: generalChannel } = await supabase
      .from('channels')
      .select('id, name')
      .eq('name', 'general')
      .single();

    if (!generalChannel) {
      console.error('General channel not found');
      return;
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', generalChannel.id)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      console.log('User already a member of general channel');
      return;
    }

    // Add user to general channel
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert([
        {
          channel_id: generalChannel.id,
          user_id: userId,
          role: 'member'
        }
      ]);

    if (memberError) {
      console.error('Error adding user to general channel:', memberError);
      return;
    }

    // Add welcome message
    const { error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          channel_id: generalChannel.id,
          user_id: userId,
          content: `<@${userId}> joined #${generalChannel.name}`,
          type: 'system'
        }
      ]);

    if (messageError) {
      console.error('Error creating welcome message:', messageError);
    }
  } catch (error) {
    console.error('Error adding user to general channel:', error);
  }
};

export default router; 