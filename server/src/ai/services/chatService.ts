import { ChatOpenAI } from '@langchain/openai';
import { similaritySearch } from './searchService';
import { EmbeddingMetadata } from '../types';

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-3.5-turbo',
  temperature: 0.7
});

/**
 * Formats message context into a readable string
 */
function formatContext(messages: { score: number | undefined; message: EmbeddingMetadata }[]): string {
  return messages
    .map(({ message, score }) => {
      const date = new Date(message.createdAt).toLocaleString();
      return `[${date}] "${message.content}" (relevance: ${(score ?? 0).toFixed(2)})`;
    })
    .join('\n');
}

/**
 * Generates an AI response to a query using relevant message context
 * @param query The user's question
 * @param channelId Optional channel ID to scope the search
 * @returns The AI's response
 */
export async function generateResponse(query: string, channelId?: string): Promise<string> {
  try {
    console.log(`Generating response for query: "${query}"`);
    
    // Get relevant messages as context
    const relevantMessages = await similaritySearch(query, channelId, 5);
    const context = formatContext(relevantMessages);
    
    // Prepare the prompt
    const prompt = `You are a helpful AI assistant in a chat application. Using the following message history as context, please answer the user's question.

    Important guidelines:
    1. Include exact timestamps when mentioning messages
    2. Pay attention to message relevance scores - higher scores (closer to 1.0) indicate more relevant messages
    3. If a message appears to be about someone but wasn't sent by them, make that clear
    4. For time-based queries, be specific about which day and time messages were sent
    5. If the context doesn't fully answer the question, explain what information you found and what's missing

    Context:
    ${context}

    User's Question: ${query}

    Response:`;

    // Generate response
    const response = await llm.invoke(prompt);
    return response.content as string;
    
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
} 