import { supabase } from '../config/supabase';

async function createMissingProfiles() {
  try {
    // Get all auth users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Get existing profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
    
    if (profilesError) throw profilesError;

    const existingProfileIds = new Set(existingProfiles?.map(p => p.id));
    const usersNeedingProfiles = users.users.filter(user => !existingProfileIds.has(user.id));

    if (usersNeedingProfiles.length === 0) {
      console.log('No missing profiles found');
      return;
    }

    // Create missing profiles
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(
        usersNeedingProfiles.map(user => ({
          id: user.id,
          email: user.email,
          username: user.email?.split('@')[0] || `user-${user.id.slice(0, 8)}`,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous User',
        }))
      );

    if (insertError) throw insertError;

    console.log(`Created ${usersNeedingProfiles.length} missing profiles`);
  } catch (error) {
    console.error('Error creating profiles:', error);
  }
}

// Run the script
createMissingProfiles(); 