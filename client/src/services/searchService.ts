import { supabase } from '../lib/supabase';
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

    // First get matching files
    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching files:', error);
      return [];
    }

    if (!files || files.length === 0) {
      return [];
    }

    // Then get message details for these files
    const messageIds = files.map(file => file.message_id).filter(Boolean);
    
    let messageDetails: Record<string, any> = {};
    
    if (messageIds.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select(`
          id,
          channel_id,
          channels (
            name
          ),
          profiles (
            username,
            full_name
          )
        `)
        .in('id', messageIds);

      if (!msgError && messages) {
        messageDetails = messages.reduce((acc: Record<string, any>, msg) => {
          acc[msg.id] = msg;
          return acc;
        }, {});
      }
    }

    return files.map(file => {
      const message = messageDetails[file.message_id];
      return {
        id: `${file.id}-${file.name}`,
        type: 'file' as const,
        title: file.name,
        subtitle: message 
          ? `Shared by ${message.profiles?.full_name || message.profiles?.username || 'Unknown User'} in #${message.channels?.name || 'unknown-channel'}`
          : 'File attachment',
        channelId: message?.channel_id || 'unknown',
        timestamp: formatDistanceToNow(new Date(file.created_at), { addSuffix: true }),
        matchingText: ''
      };
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