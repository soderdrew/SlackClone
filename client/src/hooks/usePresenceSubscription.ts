import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserPresence, UserStatus } from '../types/user';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (channelRef.current) {
      return;
    }

    console.log('Setting up presence subscription...');
    
    const channel = supabase
      .channel('presence_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Received database event:', payload);
          const newData = payload.new as ProfileRow | null;
          
          if (newData?.status) {
            console.log('Processing status update:', {
              userId: newData.id,
              status: newData.status,
              statusMessage: newData.status_message
            });
            
            const presenceUpdate: PresenceUpdate = {
              id: newData.id,
              presence: {
                status: newData.status,
                status_message: newData.status_message,
                online_at: newData.online_at
              }
            };
            
            console.log('Sending presence update:', presenceUpdate);
            onPresenceUpdate(presenceUpdate);
          } else {
            console.log('Ignoring update - no status data:', payload);
          }
        }
      );

    channelRef.current = channel;

    channel.subscribe((status: SubscriptionStatus) => {
      console.log('Channel subscription status:', status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    return () => {
      console.log('Cleaning up presence subscription');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, []); // Empty dependency array since we're using refs

  return isConnected;
}; 