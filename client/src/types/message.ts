export interface FileAttachment {
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  url?: string;
}

export interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  channel_id: string;
  is_edited: boolean;
  file_attachment?: FileAttachment;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface MessagesState {
  messages: Record<string, Message[]>; // Keyed by channel_id
  isLoading: boolean;
  error: string | null;
}

export interface SendMessageData {
  content: string;
  channel_id: string;
  file?: File;
} 