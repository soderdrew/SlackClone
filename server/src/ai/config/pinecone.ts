import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is required');
if (!process.env.PINECONE_INDEX) throw new Error('PINECONE_INDEX is required');
if (!process.env.PINECONE_INDEX_2) throw new Error('PINECONE_INDEX_2 is required');

// Regular client with anonymous key
export const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Export both index names
export const MESSAGE_INDEX_NAME = process.env.PINECONE_INDEX;
export const AVATAR_INDEX_NAME = process.env.PINECONE_INDEX_2; 