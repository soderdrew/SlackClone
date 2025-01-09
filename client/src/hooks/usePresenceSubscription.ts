import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserPresence, UserStatus } from '../types/user';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface PresenceUpdate {
  id: string;
  presence: UserPresence;
}

interface ProfileRow {
  id: string;
  status: UserStatus;
  status_message?: string;
  online_at?: string;
}

type SubscriptionStatus = 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT';

export const usePresenceSubscription = (
  onPresenceUpdate: (update: PresenceUpdate) => void
) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('Setting up presence subscription...');
    
    const channel = supabase
      .channel('presence_updates')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Received database event:', payload.eventType);
          console.log('Full payload:', payload);
          
          // Type assertion since we know the shape of our data
          const updated = (payload.new || {}) as ProfileRow;
          const previous = (payload.old || {}) as Partial<ProfileRow>;
          
          // Only process status-related changes
          if (updated.status && (
              !previous.status ||
              updated.status !== previous.status || 
              updated.status_message !== previous.status_message ||
              updated.online_at !== previous.online_at
          )) {
            const presenceUpdate: PresenceUpdate = {
              id: updated.id,
              presence: {
                status: updated.status,
                status_message: updated.status_message,
                online_at: updated.online_at
              }
            };
            
            console.log('Processing presence update:', {
              previous: previous ? {
                status: previous.status,
                status_message: previous.status_message,
                online_at: previous.online_at
              } : null,
              updated: presenceUpdate
            });
            
            onPresenceUpdate(presenceUpdate);
          } else {
            console.log('Ignoring non-presence related update');
          }
        }
      );

    // Subscribe to the channel
    channel.subscribe((status: SubscriptionStatus) => {
      console.log('Channel subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to presence updates');
        setIsConnected(true);
      } else if (status === 'CLOSED') {
        console.log('Presence subscription closed');
        setIsConnected(false);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Error subscribing to presence updates');
        setIsConnected(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up presence subscription');
      channel.unsubscribe();
    };
  }, [onPresenceUpdate]);

  return isConnected;
}; 