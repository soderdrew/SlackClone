import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { generateResponse } from '../services/chatService';
import { generateAvatarResponse, formatAvatarResponse } from '../services/avatarChatService';
import { AIQueryResponse } from '../types';
import { supabase, adminSupabase } from '../../config/supabase';

const router = Router();

interface AskRequest {
  query: string;
  channelId?: string;
}

interface AvatarChatRequest {
  query: string;
  userId: string;
}

// Regular AI chat endpoint
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

// Avatar chat endpoint
router.post('/avatar/chat', authenticateToken, async (req: Request<{}, {}, AvatarChatRequest>, res: Response): Promise<void> => {
  try {
    console.log('Received avatar chat request:', {
      body: req.body,
      headers: {
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'Present' : 'Missing'
      }
    });
    
    const { query, userId } = req.body;
    
    if (!query) {
      console.log('Missing query parameter');
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    if (!userId) {
      console.log('Missing userId parameter');
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Get user profile
    console.log('Fetching user profile for ID:', userId);
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.log('Profile fetch error:', profileError);
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    console.log('Found profile:', profile);

    // Generate response
    const response = await generateAvatarResponse(query, userId, profile);
    console.log('Raw AI response:', JSON.stringify(response, null, 2));
    
    const formattedResponse = formatAvatarResponse(response);
    console.log('Formatted response:', formattedResponse);

    const jsonResponse = { formattedResponse };
    console.log('Sending JSON response:', jsonResponse);
    
    res.json(jsonResponse);
  } catch (error: any) {
    console.error('Error in /avatar/chat endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate response'
    });
  }
});

router.post('/summarize', authenticateToken, async (req, res) => {
  // TODO: Implement summarize endpoint
});

export default router; 