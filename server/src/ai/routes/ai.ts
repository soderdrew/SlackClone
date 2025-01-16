import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { generateResponse } from '../services/chatService';
import { AIQueryResponse } from '../types';

const router = Router();

interface AskRequest {
  query: string;
  channelId?: string;
}

router.post('/ask', authenticateToken, async (req: Request<{}, {}, AskRequest>, res: Response<AIQueryResponse>): Promise<void> => {
  try {
    const { query, channelId } = req.body;
    
    if (!query) {
      res.status(400).json({ error: 'Query is required' } as any);
      return;
    }

    const response = await generateResponse(query, channelId);
    res.json(response);
  } catch (error) {
    console.error('Error in /ask endpoint:', error);
    res.status(500).json({ error: 'Failed to generate response' } as any);
  }
});

router.post('/summarize', authenticateToken, async (req, res) => {
  // TODO: Implement summarize endpoint
});

export default router; 