import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'message-attachments';

export interface FileUploadResponse {
  path: string;
  filename: string;
  size: number;
  mimeType: string;
}

export const fileService = {
  async createFileRecord(
    messageId: string,
    fileData: FileUploadResponse
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('files')
      .insert({
        message_id: messageId,
        name: fileData.filename,
        size: fileData.size,
        mime_type: fileData.mimeType,
        storage_path: fileData.path,
        created_by: userData.user.id
      });

    if (error) {
      throw new Error(`Error creating file record: ${error.message}`);
    }
  },

  async uploadFile(file: File, messageId?: string): Promise<FileUploadResponse> {
    // Create a unique filename to prevent collisions
    const timestamp = new Date().getTime();
    const uniqueFilename = `${timestamp}-${file.name}`;
    
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

    // If messageId is provided, create the file record
    if (messageId) {
      await this.createFileRecord(messageId, fileData);
    }

    return fileData;
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