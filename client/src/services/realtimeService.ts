import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { store } from '../store';
import { addMessage, updateMessage, deleteMessage, setChannelMessages } from '../features/messages/messagesSlice';
import { Message } from '../types/message';
import { messageService } from './messageService';
import { addChannel, setChannels } from '../features/channels/channelsSlice';
import { Channel } from '../types/channel';
import { channelService } from '../services/channelService';

class RealtimeService {
  private messageSubscriptions: Map<string, RealtimeChannel> = new Map();
  private dmSubscription: RealtimeChannel | null = null;
  private channelSubscription: RealtimeChannel | null = null;

  async subscribeToChannelMessages(channelId: string) {
    // Unsubscribe from existing subscription if it exists
    this.unsubscribeFromChannelMessages(channelId);

    try {
      // Fetch initial messages
      const messages = await messageService.getChannelMessages(channelId);
      store.dispatch(setChannelMessages({ channelId, messages }));

      // Create new subscription with channel type awareness
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
            try {
              const newMessage = payload.new as Message;
              // Fetch user data for the message sender
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', newMessage.user_id)
                .single();
              
              if (userData) {
                // Restructure the message with user data
                const messageWithUser = {
                  ...newMessage,
                  user: userData
                };
                
                store.dispatch(addMessage(messageWithUser));
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
            store.dispatch(deleteMessage({
              channelId,
              messageId: payload.old.id
            }));
          }
        );

      // Subscribe and handle status
      const status = await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
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

  // Subscribe to DM updates for the current user
  async subscribeToDMUpdates(userId: string) {
    if (this.dmSubscription) {
      await supabase.removeChannel(this.dmSubscription);
    }

    const channel = supabase
      .channel('dm-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id.like.dm-%`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          const channelId = newMessage.channel_id;

          // Check if this DM involves the current user
          if (channelId.includes(userId)) {
            try {
              // Fetch user data for the message sender
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', newMessage.user_id)
                .single();
              
              if (userData) {
                const messageWithUser = {
                  ...newMessage,
                  user: userData
                };

                // Dispatch the message update
                store.dispatch(addMessage(messageWithUser));
              }
            } catch (error) {
              console.error('Error handling DM update:', error);
            }
          }
        }
      );

    const status = await channel.subscribe();
    this.dmSubscription = channel;
    return channel;
  }

  // Subscribe to channel updates (including new DMs)
  async subscribeToChannels(userId: string) {
    if (this.channelSubscription) {
      await supabase.removeChannel(this.channelSubscription);
    }

    const channel = supabase
      .channel('channel-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'channels'
        },
        async (payload) => {
          switch (payload.eventType) {
            case 'INSERT': {
              const newChannel = payload.new as Channel;
              // For DMs, check if the current user is involved
              if (newChannel.type === 'direct') {
                if (newChannel.name.includes(userId)) {
                  // Add the channel to Redux state
                  store.dispatch(addChannel(newChannel));
                  
                  // Subscribe to messages for this new channel
                  await this.subscribeToChannelMessages(newChannel.id);
                }
              } else {
                // For regular channels, just add them
                store.dispatch(addChannel(newChannel));
              }
              break;
            }
            case 'UPDATE':
            case 'DELETE': {
              // Refresh all channels when there's an update or delete
              const [channels, dmChannels] = await Promise.all([
                channelService.getChannels(),
                channelService.getDMChannels()
              ]);
              store.dispatch(setChannels([...channels, ...dmChannels]));
              break;
            }
          }
        }
      );

    const status = await channel.subscribe();
    this.channelSubscription = channel;
    return channel;
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

    if (this.dmSubscription) {
      try {
        supabase.removeChannel(this.dmSubscription);
        this.dmSubscription = null;
      } catch (error) {
        console.error('Error removing DM subscription during cleanup:', error);
      }
    }

    if (this.channelSubscription) {
      try {
        supabase.removeChannel(this.channelSubscription);
        this.channelSubscription = null;
      } catch (error) {
        console.error('Error removing channel subscription during cleanup:', error);
      }
    }
  }
}

export const realtimeService = new RealtimeService(); 