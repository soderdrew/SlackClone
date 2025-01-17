import { pineconeClient, AVATAR_INDEX_NAME } from '../config/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
  batchSize: 512,
  stripNewLines: true
});

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const MINIMUM_RELEVANCE_SCORE = 0.1; // Minimum cosine similarity score to consider a match relevant

export interface AvatarSearchResult {
  score: number;
  document: {
    content: string;
    userId: string;
    documentName: string;
    createdAt: string;
    mimeType: string;
  };
}

/**
 * Formats a document's content for better readability
 * Handles different document types appropriately
 */
const formatDocumentContent = (content: string, mimeType: string): string => {
  // Remove extra whitespace and normalize line endings
  let formatted = content.replace(/\s+/g, ' ').trim();
  
  // Truncate if too long (preserving sentence boundaries)
  if (formatted.length > 1000) {
    const sentences = formatted.match(/[^.!?]+[.!?]+/g) || [];
    formatted = sentences.reduce((acc, sentence) => {
      if (acc.length + sentence.length <= 1000) {
        return acc + sentence;
      }
      return acc;
    }, '');
  }
  
  return formatted;
};

/**
 * Performs a similarity search over avatar documents using cosine similarity
 * @param query The search query
 * @param userId The ID of the user whose avatar documents to search
 * @param limit Maximum number of results to return
 * @returns Array of documents with their similarity scores
 */
export const searchAvatarDocuments = async (
  query: string,
  userId: string,
  limit: number = 5
): Promise<AvatarSearchResult[]> => {
  try {
    console.log(`\nPerforming avatar document search for query: "${query}" for user: ${userId}`);
    
    // Generate embedding for the search query
    console.log('Generating embedding for query...');
    const queryEmbedding = await embeddings.embedQuery(query);
    console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);
    
    // Search Pinecone index with retries
    console.log('Searching Pinecone index...');
    const index = pineconeClient.index(AVATAR_INDEX_NAME);
    
    let results: AvatarSearchResult[] = [];
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
      const searchResponse = await index.query({
        vector: queryEmbedding,
        filter: { userId }, // Filter by user ID
        topK: limit * 2, // Request more results to allow for filtering
        includeMetadata: true
      });
      
      results = searchResponse.matches?.map(match => ({
        score: match.score || 0,
        document: match.metadata as unknown as {
          content: string;
          userId: string;
          documentName: string;
          createdAt: string;
          mimeType: string;
        }
      }))
      // Filter out low relevance results
      .filter(result => result.score >= MINIMUM_RELEVANCE_SCORE)
      // Sort by score descending
      .sort((a, b) => b.score - a.score)
      // Take only the requested number of results
      .slice(0, limit) || [];
      
      // If we found results or we've exhausted retries, break
      if (results.length > 0 || retries === MAX_RETRIES) {
        break;
      }
      
      console.log(`No results found, retrying in ${RETRY_DELAY}ms... (Attempt ${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      retries++;
    }

    // Log search results
    console.log(`Found ${results.length} relevant documents`);
    results.forEach((result, i) => {
      console.log(`\nResult ${i + 1} (Score: ${result.score.toFixed(3)}):`);
      console.log(`Document: ${result.document.documentName}`);
      console.log(`Type: ${result.document.mimeType}`);
      console.log(`Content Preview: ${result.document.content.substring(0, 100)}...`);
    });

    return results;
  } catch (error) {
    console.error('Error in avatar document search:', error);
    throw error;
  }
};

/**
 * Gets the most relevant context from avatar documents for a given query
 * @param query The user's query
 * @param userId The ID of the user whose avatar documents to search
 * @param maxTokens Maximum number of tokens to return in context
 * @returns Formatted context string from relevant documents
 */
export const getAvatarContext = async (
  query: string,
  userId: string,
  maxTokens: number = 2000
): Promise<string> => {
  try {
    // Get relevant documents
    const searchResults = await searchAvatarDocuments(query, userId, 3);
    
    if (searchResults.length === 0) {
      return "No relevant documents found.";
    }
    
    // Format the context with document metadata and formatted content
    const context = searchResults
      .map((result, index) => {
        const formattedContent = formatDocumentContent(
          result.document.content,
          result.document.mimeType
        );
        
        const documentDate = new Date(result.document.createdAt).toLocaleDateString();
        const documentType = result.document.mimeType.split('/')[1].toUpperCase();
        
        return `[Document ${index + 1}] ${result.document.documentName} (${documentType} - ${documentDate})
Relevance Score: ${result.score.toFixed(2)}
Content: "${formattedContent}"`;
      })
      .join('\n\n');
    
    return context;
  } catch (error) {
    console.error('Error getting avatar context:', error);
    throw error;
  }
}; 