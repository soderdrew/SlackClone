import { pineconeClient, INDEX_NAME } from '../config/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingMetadata } from '../types';
import { RecordMetadata } from '@pinecone-database/pinecone';

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
  batchSize: 512,
  stripNewLines: true
});

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

type SearchResult = {
  score: number | undefined;
  message: EmbeddingMetadata;
};

/**
 * Performs a similarity search over message embeddings using cosine similarity
 * @param query The search query from the user
 * @param channelId Optional channel ID to scope the search
 * @param limit Maximum number of results to return
 * @returns Array of messages with their similarity scores
 */
export const similaritySearch = async (
  query: string,
  channelId?: string,
  limit: number = 5
) => {
  try {
    console.log(`\nPerforming similarity search for query: "${query}"${channelId ? ` in channel: ${channelId}` : ' across all channels'}`);
    
    // Generate embedding for the search query
    console.log('Generating embedding for query...');
    const queryEmbedding = await embeddings.embedQuery(query);
    console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);
    
    // Search Pinecone index with retries
    console.log('Searching Pinecone index...');
    const index = pineconeClient.index(INDEX_NAME);
    
    let results: SearchResult[] = [];
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
      const searchResponse = await index.query({
        vector: queryEmbedding,
        filter: channelId ? { channelId } : undefined,
        topK: limit,
        includeMetadata: true
      });
      
      results = searchResponse.matches?.map(match => ({
        score: match.score,
        message: match.metadata as unknown as EmbeddingMetadata
      })) || [];
      
      // If we found results or we've exhausted retries, break
      if (results.length > 0 || retries === MAX_RETRIES) {
        break;
      }
      
      console.log(`No results found, retrying in ${RETRY_DELAY}ms... (Attempt ${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      retries++;
    }
    
    console.log(`Found ${results.length} relevant messages after ${retries} retries`);
    if (results.length > 0) {
      console.log('Top match:', {
        content: results[0].message.content,
        score: results[0].score
      });
    }
    return results;
  } catch (error) {
    console.error('Error performing similarity search:', error);
    throw error;
  }
}; 