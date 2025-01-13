import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');

// Configure OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure chat model (still using LangChain for chat completions)
export const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
}); 