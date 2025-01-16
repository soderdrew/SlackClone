import { ChatOpenAI } from '@langchain/openai';
import { similaritySearch } from './searchService';
import { EmbeddingMetadata, AIQueryResponse, Source } from '../types';

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini',
  temperature: 0.7
});

const MINIMUM_RELEVANCE_SCORE = 0.3;

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
 * @returns The AI's response with relevant sources
 */
export async function generateResponse(query: string, channelId?: string): Promise<AIQueryResponse> {
  try {
    console.log(`Generating response for query: "${query}"`);
    
    // Get relevant messages as context
    const relevantMessages = await similaritySearch(query, channelId, 5);
    const context = formatContext(relevantMessages);
    
    // Prepare the prompt
    const prompt = `You are an intelligent and helpful AI assistant in a chat application. Your task is to provide accurate and relevant answers to user questions based on the message history provided below.

    Important guidelines:
    1. Consider and incorporate ALL relevant messages in your response, not just the highest scoring one.
    2. When referencing messages, use numbered citations [1], [2], etc. that correspond to the messages in chronological order.
    3. If multiple messages are relevant to the answer, cite all of them, even if they have lower relevance scores.
    4. Connect and synthesize information from different messages to provide a complete picture.
    5. Treat each message as a potentially independent event or activity - multiple things can be happening simultaneously.
    6. If messages seem to contradict each other, mention this and cite the relevant messages.
    7. If messages mention different aspects of the same topic, include all of them to provide comprehensive context.
    8. If the available context does not fully address the user's question, indicate what information you located and specify what is still needed.
    9. Always cite your sources using square brackets with numbers, e.g. [1], [2], etc.

    Context (numbered in chronological order):
    ${relevantMessages.map((msg, i) => 
      `[${i + 1}] [${new Date(msg.message.createdAt).toLocaleString()}] "${msg.message.content}" (relevance: ${(msg.score ?? 0).toFixed(2)})`
    ).join('\n')}

    User's Question: ${query}

    Please provide a comprehensive response that incorporates all relevant information from the messages above, using numbered citations to reference your sources. Remember that different messages may describe separate but related events that are all relevant to the answer.

    Response:`;

    // Generate response
    const response = await llm.invoke(prompt);
    
    // Filter and format sources
    const sources: Source[] = relevantMessages
      .filter(({ score }) => (score ?? 0) >= MINIMUM_RELEVANCE_SCORE)
      .slice(0, 3)
      .map(({ message, score }) => ({
        content: message.content,
        createdAt: message.createdAt,
        userId: message.userId,
        channelId: message.channelId,
        score: score ?? 0,
        isEdited: message.isEdited
      }));

    return {
      answer: response.content as string,
      sources
    };
    
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
} 