import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UserPresence, UserStatus } from '../types/user';
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
          const newData = payload.new as ProfileRow | null;
          
          if (newData?.status) {
            const presenceUpdate: PresenceUpdate = {
              id: newData.id,
              presence: {
                status: newData.status,
                status_message: newData.status_message,
                online_at: newData.online_at
              }
            };
            
            onPresenceUpdate(presenceUpdate);
          }
        }
      );

    channelRef.current = channel;

    channel.subscribe((status: SubscriptionStatus) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, []); // Empty dependency array since we're using refs

  return isConnected;
}; 