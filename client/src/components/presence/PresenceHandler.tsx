import { FC, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { usePresenceSubscription } from '../../hooks/usePresenceSubscription';
import { updateChannelMemberPresence, fetchChannelMembers } from '../../features/channels/channelsSlice';
import { UserPresence } from '../../types/user';

export const PresenceHandler: FC = () => {
  const dispatch = useAppDispatch();
  const channelMembers = useAppSelector(state => state.channels.channelMembers);
  const channels = useAppSelector(state => state.channels.channels);
  const currentChannel = useAppSelector(state => state.channels.currentChannel);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to ensure we have members for the current channel
  useEffect(() => {
    if (currentChannel?.id && !channelMembers[currentChannel.id]) {
      dispatch(fetchChannelMembers(currentChannel.id));
    }
  }, [currentChannel?.id, channelMembers, dispatch]);

  const handlePresenceUpdate = useCallback((update: { id: string; presence: UserPresence }) => {
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the updates to prevent rapid-fire dispatches
    updateTimeoutRef.current = setTimeout(() => {
      try {
        if (Object.keys(channelMembers).length === 0) return;

        // Update presence for all channels
        Object.entries(channelMembers).forEach(([channelId, members]) => {
          const channel = channels.find(c => c.id === channelId);
          
          // For direct message channels, we want to update if either user is the one who changed status
          const isMember = channel?.type === 'direct' 
            ? members.some(member => member.user?.id === update.id || member.user_id === update.id)
            : members.some(member => member.user?.id === update.id || member.user_id === update.id);

          if (isMember) {
            dispatch(updateChannelMemberPresence({
              channelId,
              userId: update.id,
              presence: update.presence
            }));

            // If this is the current channel, refresh the member list to ensure we have the latest data
            if (currentChannel?.id === channelId) {
              dispatch(fetchChannelMembers(channelId));
            }
          }
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    }, 100); // Small delay to batch updates
  }, [dispatch, channelMembers, channels, currentChannel]);

  usePresenceSubscription(handlePresenceUpdate);

  return null;
}; 