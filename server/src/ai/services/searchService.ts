import { pineconeClient, INDEX_NAME } from '../config/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingMetadata } from '../types';
import { RecordMetadata } from '@pinecone-database/pinecone';

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
//   modelName: 'text-embedding-ada-002',
  modelName: 'text-embedding-3-small',
  batchSize: 512,
  stripNewLines: true
});

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
    
    // Search Pinecone index
    console.log('Searching Pinecone index...');
    const index = pineconeClient.index(INDEX_NAME);
    const searchResponse = await index.query({
      vector: queryEmbedding,
      filter: channelId ? { channelId } : undefined,
      topK: limit,
      includeMetadata: true
    });
    
    // Transform and return results
    const results = searchResponse.matches?.map(match => ({
      score: match.score,
      message: match.metadata as unknown as EmbeddingMetadata
    })) || [];
    
    console.log(`Found ${results.length} relevant messages`);
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