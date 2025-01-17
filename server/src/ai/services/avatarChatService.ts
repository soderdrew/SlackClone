import { ChatOpenAI } from '@langchain/openai';
import { getAvatarContext } from './avatarSearchService';
import { Profile } from '../../types/user';

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
});

export interface AvatarChatResponse {
  answer: string;
  relevantDocuments: {
    name: string;
    type: string;
    relevance: number;
  }[];
}

/**
 * Generates a chat response from an AI Avatar based on their documents
 */
export const generateAvatarResponse = async (
  query: string,
  userId: string,
  profile: Profile
): Promise<AvatarChatResponse> => {
  try {
    console.log(`Generating avatar response for query: "${query}" from user: ${userId}`);
    
    // Get relevant context from avatar documents
    const context = await getAvatarContext(query, userId);
    
    // Prepare the prompt with avatar personality and context
    const prompt = `You are an AI Avatar representing ${profile.username}. Your responses should be based on the context provided from their documents, and you should maintain a consistent personality that matches their background and expertise.

    Important guidelines:
    1. Always respond in the first person, as if you are ${profile.username}
    2. Use the writing style and tone that matches the documents
    3. Only make statements that are supported by the provided context
    4. If you're unsure about something, acknowledge the uncertainty
    5. Keep responses concise but informative
    6. If the question cannot be answered from the available context, say so
    7. Maintain professional demeanor while showing personality

    Bio: ${profile.bio || 'No bio provided'}

    Relevant Context:
    ${context}

    Question: ${query}

    Please provide a natural, first-person response that draws from the relevant context while maintaining a consistent personality.`;

    // Generate the response
    const response = await chatModel.invoke(prompt);
    
    // Extract the message content
    const responseContent = response.content as string;
    
    console.log('Raw response:', response); // Debug log
    console.log('Response content:', responseContent); // Debug log
    
    // Extract document references from context to include in response
    const documentMatches = context.match(/\[Document \d+\] (.*?) \((.*?) - .*?\)\nRelevance Score: ([\d.]+)/g);
    const relevantDocuments = documentMatches?.map(match => {
      const [_, name, type, score] = match.match(/\[Document \d+\] (.*?) \((.*?) - .*?\)\nRelevance Score: ([\d.]+)/) || [];
      return {
        name,
        type,
        relevance: parseFloat(score)
      };
    }) || [];

    return {
      answer: responseContent,
      relevantDocuments
    };
  } catch (error) {
    console.error('Error generating avatar response:', error);
    throw error;
  }
};

/**
 * Formats the avatar's response for display
 */
export const formatAvatarResponse = (response: AvatarChatResponse): string => {
  let formatted = response.answer;

  if (response.relevantDocuments.length > 0) {
    formatted += '\n\nSources:';
    response.relevantDocuments.forEach((doc, index) => {
      formatted += `\n${index + 1}. ${doc.name}`;
    });
  }

  return formatted;
}; 