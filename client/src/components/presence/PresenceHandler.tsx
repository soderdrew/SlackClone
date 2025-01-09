import { FC, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { usePresenceSubscription } from '../../hooks/usePresenceSubscription';
import { updateChannelMemberPresence, fetchChannelMembers } from '../../features/channels/channelsSlice';
import { UserPresence } from '../../types/user';
import { Channel } from '../../types/channel';

export const PresenceHandler: FC = () => {
  const dispatch = useAppDispatch();
  const channelMembers = useAppSelector(state => state.channels.channelMembers);
  const channels = useAppSelector(state => state.channels.channels);
  const currentChannel = useAppSelector(state => state.channels.currentChannel);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to ensure we have members for the current channel
  useEffect(() => {
    if (currentChannel?.id && !channelMembers[currentChannel.id]) {
      console.log('Fetching members for current channel:', currentChannel.id);
      dispatch(fetchChannelMembers(currentChannel.id));
    }
  }, [currentChannel?.id, channelMembers, dispatch]);

  // Debug effect for channelMembers
  useEffect(() => {
    console.log('PresenceHandler channelMembers state:', {
      channels: Object.keys(channelMembers),
      memberCounts: Object.fromEntries(
        Object.entries(channelMembers).map(([k, v]) => [k, v.length])
      ),
      currentChannelId: currentChannel?.id
    });
  }, [channelMembers, currentChannel]);

  const handlePresenceUpdate = useCallback((update: { id: string; presence: UserPresence }) => {
    console.log('PresenceHandler received update:', update);
    
    // Log detailed state for debugging
    const channelDetails = Object.entries(channelMembers).map(([channelId, members]) => {
      const channel = channels.find(c => c.id === channelId);
      return {
        channelId,
        type: channel?.type,
        memberCount: members.length,
        memberIds: members.map(m => m.user?.id || m.user_id)
      };
    });
    
    console.log('Current state when processing update:', {
      hasChannels: Object.keys(channelMembers).length > 0,
      channels: channelDetails,
      updateUserId: update.id
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
          const channel = channels.find(c => c.id === channelId);
          console.log(`Checking channel ${channelId} (type: ${channel?.type}) with ${members.length} members:`, {
            memberIds: members.map(m => m.user?.id || m.user_id),
            updateUserId: update.id
          });
          
          // For direct message channels, we want to update if either user is the one who changed status
          const isMember = channel?.type === 'direct' 
            ? members.some(member => {
                const isMatch = member.user?.id === update.id || member.user_id === update.id;
                console.log('Checking DM member:', {
                  memberId: member.user?.id || member.user_id,
                  updateId: update.id,
                  isMatch,
                  channelType: channel.type
                });
                return isMatch;
              })
            : members.some(member => {
                const isMatch = member.user?.id === update.id || member.user_id === update.id;
                console.log('Checking regular member:', {
                  memberId: member.user?.id || member.user_id,
                  updateId: update.id,
                  isMatch,
                  channelType: channel?.type
                });
                return isMatch;
              });

          if (isMember) {
            console.log(`Dispatching presence update for user ${update.id} in channel ${channelId} (type: ${channel?.type})`, {
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
            console.log(`User ${update.id} not found in channel ${channelId} (type: ${channel?.type})`);
          }
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    }, 100); // Small delay to batch updates
  }, [dispatch, channelMembers, channels]);

  usePresenceSubscription(handlePresenceUpdate);

  return null;
}; 