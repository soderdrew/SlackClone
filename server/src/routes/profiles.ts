import { Router, Request, Response } from 'express';
import { supabase, adminSupabase } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get user's profile
router.get('/:userId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ profile: data });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch profile' 
    });
  }
});

// Update user's bio
router.patch('/bio', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { bio } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID not found in token' });
      return;
    }

    if (bio === undefined) {
      res.status(400).json({ error: 'Bio is required' });
      return;
    }

    console.log('Attempting to update bio for user:', userId);

    // Update the profile using the admin client
    const { data: updatedProfile, error: updateError } = await adminSupabase
      .from('profiles')
      .update({ bio })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    console.log('Successfully updated bio for user:', userId);
    res.json({ profile: updatedProfile });
  } catch (error: any) {
    console.error('Error updating bio:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update bio',
      details: error.details || undefined
    });
  }
});

export default router; 