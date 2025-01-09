import { FC, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { usePresenceSubscription } from '../../hooks/usePresenceSubscription';
import { updateChannelMemberPresence } from '../../features/channels/channelsSlice';
import { UserPresence } from '../../types/user';

export const PresenceHandler: FC = () => {
  const dispatch = useAppDispatch();
  const channelMembers = useAppSelector(state => state.channels.channelMembers);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add debug effect for channelMembers
  useEffect(() => {
    console.log('PresenceHandler channelMembers state:', {
      channels: Object.keys(channelMembers),
      memberCounts: Object.fromEntries(
        Object.entries(channelMembers).map(([k, v]) => [k, v.length])
      )
    });
  }, [channelMembers]);

  const handlePresenceUpdate = useCallback((update: { id: string; presence: UserPresence }) => {
    console.log('PresenceHandler received update:', update);
    console.log('Current channelMembers state:', {
      hasChannels: Object.keys(channelMembers).length > 0,
      channels: Object.keys(channelMembers)
    });
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the updates to prevent rapid-fire dispatches
    updateTimeoutRef.current = setTimeout(() => {
      try {
        if (Object.keys(channelMembers).length === 0) {
          console.warn('No channel members available when processing presence update');
          return;
        }

        // Update presence for all channels
        Object.entries(channelMembers).forEach(([channelId, members]) => {
          console.log(`Checking channel ${channelId} with ${members.length} members`);
          
          // Check if the user is a member of this channel
          const isMember = members.some(member => {
            const isMatch = member.user?.id === update.id || member.user_id === update.id;
            console.log('Checking member:', {
              memberId: member.user?.id || member.user_id,
              updateId: update.id,
              isMatch
            });
            return isMatch;
          });

          if (isMember) {
            console.log(`Dispatching presence update for user ${update.id} in channel ${channelId}`, {
              channelId,
              userId: update.id,
              presence: update.presence
            });
            
            dispatch(updateChannelMemberPresence({
              channelId,
              userId: update.id,
              presence: update.presence
            }));
          } else {
            console.log(`User ${update.id} not found in channel ${channelId}`);
          }
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    }, 100); // Small delay to batch updates
  }, [dispatch, channelMembers]);

  usePresenceSubscription(handlePresenceUpdate);

  return null;
}; 