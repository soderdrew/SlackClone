import { embedDocument, deleteDocumentEmbedding } from '../services/documentEmbedding';
import { AvatarDocument } from '../../types/documents';
import { adminSupabase } from '../../config/supabase';

/**
 * Handles the embedding of a new avatar document
 */
export const handleNewDocument = async (documentData: AvatarDocument) => {
  try {
    console.log(`Processing embedding for new document: ${documentData.id}`);
    
    // First update status to processing
    await updateDocumentStatus(documentData.id, 'processing');
    
    // Generate and store embedding
    await embedDocument(documentData);
    
    // Update status to completed
    await updateDocumentStatus(documentData.id, 'completed');
    
    console.log(`Successfully embedded document: ${documentData.id}`);
  } catch (error) {
    console.error(`Error handling document embedding: ${documentData.id}`, error);
    // Update status to failed
    await updateDocumentStatus(documentData.id, 'failed');
    throw error;
  }
};

/**
 * Handles the deletion of a document
 */
export const handleDocumentDeletion = async (documentId: string) => {
  try {
    console.log(`Processing embedding deletion for document: ${documentId}`);
    await deleteDocumentEmbedding(documentId);
    console.log(`Successfully deleted embedding for document: ${documentId}`);
  } catch (error) {
    console.error(`Error handling document deletion embedding: ${documentId}`, error);
    throw error;
  }
};

/**
 * Updates the embedding status of a document
 */
const updateDocumentStatus = async (
  documentId: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed'
) => {
  try {
    const { error } = await adminSupabase
      .from('avatar_documents')
      .update({ embedding_status: status })
      .eq('id', documentId);

    if (error) throw error;
  } catch (error) {
    console.error(`Error updating document status: ${documentId}`, error);
    throw error;
  }
}; 