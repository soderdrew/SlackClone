import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { adminSupabase } from '../config/supabase';

const router = Router();

// Get user's documents
router.get('/:userId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { data: documents, error } = await adminSupabase
      .from('avatar_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
      return;
    }

    res.json({ documents: documents || [] });
  } catch (error: any) {
    console.error('Error in get documents:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch documents' 
    });
  }
});

export default router; 