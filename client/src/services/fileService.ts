import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'message-attachments';

export interface FileUploadResponse {
  path: string;
  filename: string;
  size: number;
  mimeType: string;
}

export const fileService = {
  async uploadFile(file: File): Promise<FileUploadResponse> {
    // Create a unique filename to prevent collisions
    const timestamp = new Date().getTime();
    const uniqueFilename = `${timestamp}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFilename, file);

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }

    return {
      path: data.path,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    };
  },

  async getFileUrl(path: string): Promise<string> {
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw new Error(`Error deleting file: ${error.message}`);
    }
  }
}; 