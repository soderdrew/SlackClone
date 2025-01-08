import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getUserWithRetry = async (token: string, retries = 0): Promise<{ user: User | null; error: any }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return { user, error };
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return getUserWithRetry(token, retries + 1);
    }
    return { user: null, error };
  }
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const { user, error } = await getUserWithRetry(token);

    if (error || !user) {
      console.error('Auth error:', error);
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 