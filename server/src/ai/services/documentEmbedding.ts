import { openai } from '../config/openai';
import { pineconeClient, AVATAR_INDEX_NAME } from '../config/pinecone';
import { processDocument } from './documentProcessing';
import { PineconeRecord } from '@pinecone-database/pinecone';
import { AvatarDocument } from '../../types/documents';

/**
 * Embeds a document and stores it in Pinecone
 */
export const embedDocument = async (document: AvatarDocument) => {
  try {
    // 1. Process the document
    const processedDoc = await processDocument(document.id);

    // 2. Generate embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: processedDoc.content,
      encoding_format: "float"
    });

    const embedding = response.data[0].embedding;

    // 3. Prepare vector with metadata
    const vector: PineconeRecord = {
      id: document.id,
      values: embedding,
      metadata: {
        content: processedDoc.content,
        userId: document.user_id,
        documentName: document.name,
        createdAt: document.created_at,
        createdBy: document.created_by,
        mimeType: document.mime_type,
        storagePath: document.storage_path,
        description: document.description || '',
        isProcessed: document.is_processed,
        embeddingStatus: document.embedding_status
      }
    };

    // 4. Upsert to Pinecone
    const index = pineconeClient.index(AVATAR_INDEX_NAME);
    await index.upsert([vector]);

    console.log(`Successfully embedded document: ${document.id}`);
  } catch (error: any) {
    console.error('Error embedding document:', error);
    if (error.response?.data) {
      console.error('OpenAI API Error details:', error.response.data);
    }
    throw error;
  }
};

/**
 * Deletes a document's embedding from Pinecone
 */
export const deleteDocumentEmbedding = async (documentId: string) => {
  try {
    const index = pineconeClient.index(AVATAR_INDEX_NAME);
    await index.deleteOne(documentId);
    console.log(`Successfully deleted embedding for document ${documentId}`);
  } catch (error) {
    console.error('Error deleting document embedding:', error);
    throw error;
  }
}; 