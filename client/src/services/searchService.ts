import { supabase } from '../lib/supabase';
import { Message } from '../types/message';
import { formatDistanceToNow } from 'date-fns';

interface SearchOptions {
  query: string;
  type?: 'message' | 'file' | 'all';
  limit?: number;
}

interface SearchResult {
  id: string;
  type: 'message' | 'file';
  title: string;
  subtitle: string;
  channelId: string;
  timestamp: string;
  matchingText?: string;
}

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface MessageWithRelations {
  id: string;
  content: string;
  created_at: string;
  channel_id: string;
  user_id: string;
  file_attachments: FileAttachment[] | null;
  channels: {
    name: string;
    type: string;
  };
  users: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

class SearchService {
  async searchMessages(options: SearchOptions): Promise<SearchResult[]> {
    const { query, limit = 20 } = options;

    console.log('Starting message search with query:', query);

    // Simple case-insensitive search using proper select syntax
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, channels(*), profiles(*)')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error during search:', error);
      return [];
    }

    console.log('Raw database results:', messages);

    // Check if we have any messages
    if (!messages || messages.length === 0) {
      console.log('No messages found matching query:', query);
      return [];
    }

    // Map the results
    const results = messages.map((message: any) => {
      console.log('Processing message:', {
        id: message.id,
        content: message.content,
        user: message.profiles,
        channel: message.channels
      });
      
      return {
        id: message.id,
        type: 'message' as const,
        title: message.profiles?.full_name || message.profiles?.username || 'Unknown User',
        subtitle: `#${message.channels?.name || 'unknown-channel'}`,
        channelId: message.channel_id,
        timestamp: formatDistanceToNow(new Date(message.created_at), { addSuffix: true }),
        matchingText: message.content
      };
    });

    console.log('Final processed results:', results);
    return results;
  }

  async searchFiles(options: SearchOptions): Promise<SearchResult[]> {
    const { query, limit = 20 } = options;

    console.log('Starting file search with query:', query);

    // First, let's get a message with file attachments to see the structure
    const { data: sampleMessage } = await supabase
      .from('messages')
      .select('*')
      .not('file_attachment', 'is', null)
      .limit(1);

    console.log('Sample message with attachment:', sampleMessage);

    // Search file attachments with proper select syntax
    const { data: files, error } = await supabase
      .from('messages')
      .select('*, channels(*), profiles(*)')
      .not('file_attachment', 'is', null)
      .or(`file_attachment->filename.ilike.%${query}%,file_attachment->name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching files:', error);
      return [];
    }

    console.log('Files search results:', files);

    return (files || []).flatMap((message: any) => {
      if (!message.file_attachment) return [];
      
      const attachment = message.file_attachment;
      console.log('Processing attachment:', attachment);

      // Check both filename and name fields
      const fileName = attachment.filename || attachment.name;
      if (!fileName || !fileName.toLowerCase().includes(query.toLowerCase())) return [];

      return [{
        id: `${message.id}-${fileName}`,
        type: 'file' as const,
        title: fileName,
        subtitle: `Shared by ${message.profiles?.full_name || message.profiles?.username || 'Unknown User'} in #${message.channels?.name || 'unknown-channel'}`,
        channelId: message.channel_id,
        timestamp: formatDistanceToNow(new Date(message.created_at), { addSuffix: true }),
        matchingText: message.content
      }];
    });
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { type = 'all' } = options;

    let results: SearchResult[] = [];

    if (type === 'all' || type === 'message') {
      const messageResults = await this.searchMessages(options);
      results = [...results, ...messageResults];
    }

    if (type === 'all' || type === 'file') {
      const fileResults = await this.searchFiles(options);
      results = [...results, ...fileResults];
    }

    // Sort results by timestamp
    return results.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }
}

export const searchService = new SearchService(); 