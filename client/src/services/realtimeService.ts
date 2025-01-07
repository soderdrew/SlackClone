import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { store } from '../store';
import { addMessage, updateMessage, deleteMessage } from '../features/messages/messagesSlice';
import { Message } from '../types/message';

class RealtimeService {
  private messageSubscriptions: Map<string, RealtimeChannel> = new Map();

  subscribeToChannelMessages(channelId: string) {
    // Unsubscribe from existing subscription if it exists
    this.unsubscribeFromChannelMessages(channelId);

    // Create new subscription
    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          store.dispatch(addMessage(newMessage));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          store.dispatch(updateMessage(updatedMessage));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const deletedMessage = payload.old as Message;
          store.dispatch(
            deleteMessage({
              channelId,
              messageId: deletedMessage.id,
            })
          );
        }
      )
      .subscribe();

    this.messageSubscriptions.set(channelId, subscription);
  }

  unsubscribeFromChannelMessages(channelId: string) {
    const subscription = this.messageSubscriptions.get(channelId);
    if (subscription) {
      subscription.unsubscribe();
      this.messageSubscriptions.delete(channelId);
    }
  }

  // Clean up all subscriptions
  cleanup() {
    this.messageSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.messageSubscriptions.clear();
  }
}

export const realtimeService = new RealtimeService(); 