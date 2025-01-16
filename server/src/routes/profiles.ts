import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
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

    if (bio === undefined) {
      res.status(400).json({ error: 'Bio is required' });
      return;
    }

    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update({ bio })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ profile: data });
  } catch (error: any) {
    console.error('Error updating bio:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update bio' 
    });
  }
});

export default router; 