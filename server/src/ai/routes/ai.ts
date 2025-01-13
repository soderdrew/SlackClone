import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { AIQueryOptions } from '../types';

const router = Router();

// We'll implement these endpoints later
router.post('/ask', authenticateToken, async (req, res) => {
  // TODO: Implement ask endpoint
});

router.post('/summarize', authenticateToken, async (req, res) => {
  // TODO: Implement summarize endpoint
});

export default router; 