import { embedMessage, deleteMessageEmbedding } from './embedding';
import { EmbeddingMetadata } from '../types';

/**
 * Handles the embedding of a new message
 * @param messageData The message data from the database
 */
export const handleNewMessage = async (messageData: {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  is_edited: boolean;
  type: string;
  file_attachment?: any;
}) => {
  try {
    console.log(`Processing embedding for new message: ${messageData.id}`);
    
    // Convert message data to EmbeddingMetadata format
    const metadata: EmbeddingMetadata = {
      messageId: messageData.id,
      channelId: messageData.channel_id,
      userId: messageData.user_id,
      createdAt: messageData.created_at,
      updatedAt: messageData.updated_at,
      content: messageData.content,
      isEdited: messageData.is_edited,
      messageType: messageData.type || 'message',
      hasAttachment: !!messageData.file_attachment
    };

    // Generate and store embedding
    await embedMessage(metadata);
    console.log(`Successfully embedded message: ${messageData.id}`);
  } catch (error) {
    console.error(`Error handling new message embedding: ${messageData.id}`, error);
    throw error;
  }
};

/**
 * Handles the update of an existing message
 * @param messageData The updated message data
 */
export const handleMessageUpdate = async (messageData: {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  type: string;
  file_attachment?: any;
}) => {
  try {
    console.log('Message update data:', {
      messageId: messageData.id,
      content: messageData.content,
      isEdited: messageData.is_edited,
      updatedAt: messageData.updated_at
    });
    
    // First, delete the old embedding
    await deleteMessageEmbedding(messageData.id);
    
    // Then create new embedding with updated content
    await handleNewMessage(messageData);
    
    console.log(`Successfully updated embedding for message: ${messageData.id}`);
  } catch (error) {
    console.error(`Error handling message update embedding: ${messageData.id}`, error);
    throw error;
  }
};

/**
 * Handles the deletion of a message
 * @param messageId The ID of the deleted message
 */
export const handleMessageDeletion = async (messageId: string) => {
  try {
    console.log(`Processing embedding deletion for message: ${messageId}`);
    await deleteMessageEmbedding(messageId);
    console.log(`Successfully deleted embedding for message: ${messageId}`);
  } catch (error) {
    console.error(`Error handling message deletion embedding: ${messageId}`, error);
    throw error;
  }
}; 