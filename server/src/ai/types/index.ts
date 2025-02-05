export interface EmbeddingMetadata {
  messageId: string;
  channelId: string;
  userId: string;
  createdAt: string;
  content: string;
  isEdited: boolean;
  messageType: string;
  hasAttachment: boolean;
  updatedAt?: string;
}

export interface Source {
  content: string;
  createdAt: string;
  userId: string;
  channelId: string;
  score: number;
  isEdited?: boolean;
}

export interface AIQueryResponse {
  answer: string;
  sources: Source[];
}

export interface AIQueryOptions {
  channelId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  maxResults?: number;
  includeEditedMessages?: boolean;
  messageTypes?: string[];
} 