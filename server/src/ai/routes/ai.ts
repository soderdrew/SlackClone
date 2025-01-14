import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { generateResponse } from '../services/chatService';

const router = Router();

interface AskRequest {
  query: string;
  channelId?: string;
}

router.post('/ask', authenticateToken, async (req: Request<{}, {}, AskRequest>, res: Response): Promise<void> => {
  try {
    const { query, channelId } = req.body;
    
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const answer = await generateResponse(query, channelId);
    res.json({ answer });
  } catch (error) {
    console.error('Error in /ask endpoint:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

router.post('/summarize', authenticateToken, async (req, res) => {
  // TODO: Implement summarize endpoint
});

export default router; 