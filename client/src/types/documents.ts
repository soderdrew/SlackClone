import { Profile } from './user';

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

export interface AvatarDocumentWithUser extends AvatarDocument {
  user: Profile;
  created_by_user: Profile;
}

// Database insert type (omitting auto-generated fields)
export type AvatarDocumentInsert = Omit<
  AvatarDocument,
  'id' | 'created_at' | 'is_processed' | 'embedding_status'
>; 