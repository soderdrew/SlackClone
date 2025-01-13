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

export interface AIQueryResponse {
  answer: string;
  relevantMessages: Array<{
    content: string;
    createdAt: string;
    userId: string;
    isEdited?: boolean;
    messageType?: string;
  }>;
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