export type EmbeddingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AvatarDocument {
  id: string;
  user_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  created_by: string;
  description: string | null;
  is_processed: boolean;
  embedding_status: EmbeddingStatus;
}

export interface AvatarDocumentMetadata {
  documentId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  description?: string;
} 