import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is required');
if (!process.env.PINECONE_INDEX) throw new Error('PINECONE_INDEX is required');

// We'll implement the actual client setup later
export const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const INDEX_NAME = process.env.PINECONE_INDEX; 