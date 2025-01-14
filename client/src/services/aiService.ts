import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { store } from '../store';
import { RootState } from '../store/store';

interface AIResponse {
  answer: string;
  relevantMessages: Array<{
    content: string;
    createdAt: string;
    userId: string;
    isEdited?: boolean;
    messageType?: string;
  }>;
}

class AIService {
  private baseUrl = `${API_BASE_URL}/api/ai`;

  async askQuestion(question: string, channelId: string): Promise<string> {
    try {
      const state = store.getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post<AIResponse>(
        `${this.baseUrl}/ask`,
        {
          query: question,
          channelId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data.answer;
    } catch (error) {
      console.error('Error in AI service:', error);
      throw error;
    }
  }
}

export const aiService = new AIService(); 