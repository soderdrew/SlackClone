import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { store } from '../store';
import { addMessage, updateMessage, deleteMessage, setChannelMessages } from '../features/messages/messagesSlice';
import { Message } from '../types/message';
import { messageService } from './messageService';

class RealtimeService {
  private messageSubscriptions: Map<string, RealtimeChannel> = new Map();

  async subscribeToChannelMessages(channelId: string) {
    // Unsubscribe from existing subscription if it exists
    this.unsubscribeFromChannelMessages(channelId);

    try {
      // Fetch initial messages
      const messages = await messageService.getChannelMessages(channelId);
      store.dispatch(setChannelMessages({ channelId, messages }));

      // Create new subscription
      const channel = supabase
        .channel(`messages:${channelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`
          },
          async (payload) => {
            console.log('REALTIME - Received INSERT update:', payload);
            try {
              const newMessage = payload.new as Message;
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', newMessage.user_id)
                .single();
              
              if (userData) {
                // Restructure the message to match existing format
                const messageWithUser = {
                  ...newMessage,
                  user: userData
                };
                
                console.log('REALTIME - Dispatching new message:', messageWithUser);
                store.dispatch(addMessage(messageWithUser));
                
                // Verify the state after dispatch
                const currentState = store.getState();
                console.log('REALTIME - State after dispatch:', {
                  channelMessages: currentState.messages.messages[channelId],
                  messageCount: currentState.messages.messages[channelId]?.length,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (error) {
              console.error('Error handling INSERT:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`
          },
          async (payload) => {
            console.log('REALTIME - Received UPDATE:', payload);
            try {
              const updatedMessage = payload.new as Message;
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', updatedMessage.user_id)
                .single();
              
              if (userData) {
                const messageWithUser = {
                  ...updatedMessage,
                  user: userData
                };
                store.dispatch(updateMessage(messageWithUser));
              }
            } catch (error) {
              console.error('Error handling UPDATE:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`
          },
          (payload) => {
            console.log('REALTIME - Received DELETE:', payload);
            store.dispatch(deleteMessage({
              channelId,
              messageId: payload.old.id
            }));
          }
        );

      // Subscribe and handle status
      const status = await channel.subscribe((status) => {
        console.log('REALTIME - Subscription status:', {
          channelId,
          status,
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          console.log('REALTIME - Successfully subscribed to channel:', channelId);
          // Refresh messages after successful subscription
          messageService.getChannelMessages(channelId).then(messages => {
            store.dispatch(setChannelMessages({ channelId, messages }));
          });
        }
      });

      this.messageSubscriptions.set(channelId, channel);
      return channel;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      return null;
    }
  }

  unsubscribeFromChannelMessages(channelId: string) {
    const subscription = this.messageSubscriptions.get(channelId);
    if (subscription) {
      try {
        supabase.removeChannel(subscription);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
      this.messageSubscriptions.delete(channelId);
    }
  }

  // Clean up all subscriptions
  cleanup() {
    this.messageSubscriptions.forEach((subscription) => {
      try {
        supabase.removeChannel(subscription);
      } catch (error) {
        console.error('Error removing channel during cleanup:', error);
      }
    });
    this.messageSubscriptions.clear();
  }
}

export const realtimeService = new RealtimeService(); 