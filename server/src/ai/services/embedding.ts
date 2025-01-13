import { EmbeddingMetadata } from '../types';
import { openai } from '../config/openai';
import { pineconeClient, INDEX_NAME } from '../config/pinecone';
import { PineconeRecord } from '@pinecone-database/pinecone';

export const embedMessage = async (message: EmbeddingMetadata) => {
  return embedMessages([message]);
};

export const embedMessages = async (messages: EmbeddingMetadata[]) => {
  try {
    // 1. Get the index
    const index = pineconeClient.index(INDEX_NAME);

    // 2. Clean and prepare texts
    const texts = messages.map(msg => {
      // Basic text cleaning
      let cleanText = msg.content.trim();
      // Remove excessive whitespace
      cleanText = cleanText.replace(/\s+/g, ' ');
      // Remove any null characters
      cleanText = cleanText.replace(/\0/g, '');
      return cleanText;
    });

    // 3. Generate embeddings in smaller batches
    const BATCH_SIZE = 20; // Process 20 texts at a time
    const embeddings_array: number[][] = [];
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + BATCH_SIZE);
      console.log(`Generating embeddings for batch ${i / BATCH_SIZE + 1} of ${Math.ceil(texts.length / BATCH_SIZE)}`);
      
      // Each text needs to be a string, not an array of strings
      for (const text of batchTexts) {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text, // Pass single string instead of array
          encoding_format: "float"
        });
        
        embeddings_array.push(response.data[0].embedding);
      }
      
      // Add a small delay between batches
      if (i + BATCH_SIZE < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 4. Prepare vectors with metadata for Pinecone
    const vectors: PineconeRecord[] = messages.map((msg, i) => ({
      id: msg.messageId,
      values: embeddings_array[i],
      metadata: {
        content: msg.content,
        channelId: msg.channelId,
        userId: msg.userId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt || msg.createdAt,
        isEdited: msg.isEdited ? 1 : 0,
        messageType: msg.messageType,
        hasAttachment: msg.hasAttachment ? 1 : 0
      }
    }));

    // 5. Upsert to Pinecone in smaller batches
    const UPSERT_BATCH_SIZE = 100;
    for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
      const batchVectors = vectors.slice(i, i + UPSERT_BATCH_SIZE);
      console.log(`Upserting batch ${i / UPSERT_BATCH_SIZE + 1} of ${Math.ceil(vectors.length / UPSERT_BATCH_SIZE)}`);
      
      await index.upsert(batchVectors);
      
      // Add a small delay between upserts
      if (i + UPSERT_BATCH_SIZE < vectors.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Successfully embedded ${messages.length} messages`);
  } catch (error: any) {
    console.error('Error embedding messages:', error);
    if (error.response?.data) {
      console.error('OpenAI API Error details:', error.response.data);
    }
    throw error;
  }
};

export const deleteMessageEmbedding = async (messageId: string) => {
  try {
    const index = pineconeClient.index(INDEX_NAME);
    await index.deleteOne(messageId);
    console.log(`Successfully deleted embedding for message ${messageId}`);
  } catch (error) {
    console.error('Error deleting message embedding:', error);
    throw error;
  }
}; 