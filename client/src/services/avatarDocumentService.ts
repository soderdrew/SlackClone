import { supabase } from '../lib/supabase';
import { AvatarDocument, AvatarDocumentInsert } from '../types/documents';
import { API_BASE_URL } from '../config/api';
import { store } from '../store';
import { RootState } from '../store/store';
import axios from 'axios';

const BUCKET_NAME = 'avatars';

export interface AvatarDocumentUploadResponse {
  path: string;
  filename: string;
  size: number;
  mimeType: string;
}

export const avatarDocumentService = {
  async createDocumentRecord(
    fileData: AvatarDocumentUploadResponse,
    description?: string
  ): Promise<AvatarDocument> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const documentData: AvatarDocumentInsert = {
      user_id: userData.user.id,
      name: fileData.filename,
      size: fileData.size,
      mime_type: fileData.mimeType,
      storage_path: fileData.path,
      created_by: userData.user.id,
      description: description || null
    };

    const { data, error } = await supabase
      .from('avatar_documents')
      .insert(documentData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error creating document record: ${error.message}`);
    }

    return data;
  },

  async uploadDocument(file: File, description?: string): Promise<AvatarDocument> {
    // Validate file type (only allow readable text files)
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/json',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only text files are allowed.');
    }

    // Create a unique filename to prevent collisions
    const timestamp = new Date().getTime();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    const uniqueFilename = `${userData.user.id}/${timestamp}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFilename, file);

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }

    const fileData = {
      path: data.path,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    };

    // Create the document record
    return await this.createDocumentRecord(fileData, description);
  },

  async getDocumentUrl(path: string): Promise<string> {
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  async deleteDocument(document: AvatarDocument): Promise<void> {
    // First delete the file from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([document.storage_path]);

    if (storageError) {
      throw new Error(`Error deleting file from storage: ${storageError.message}`);
    }

    // Then delete the document record
    const { error: dbError } = await supabase
      .from('avatar_documents')
      .delete()
      .eq('id', document.id);

    if (dbError) {
      throw new Error(`Error deleting document record: ${dbError.message}`);
    }
  },

  async getUserDocuments(userId: string): Promise<AvatarDocument[]> {
    try {
      const state = store.getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<{ documents: AvatarDocument[] }>(
        `${API_BASE_URL}/api/documents/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data.documents || [];
    } catch (error) {
      console.error('Error fetching user documents:', error);
      throw error;
    }
  }
}; 