import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Message } from '../../types/message';
import { setChannelMessages, setLoading } from '../../features/messages/messagesSlice';
import { setCurrentChannel, fetchChannelMembers, selectChannelMembers } from '../../features/channels/channelsSlice';
import { messageService } from '../../services/messageService';
import { channelService } from '../../services/channelService';
import { realtimeService } from '../../services/realtimeService';
import { MessageContent } from '../messages/MessageContent';
import { MessageActions } from '../messages/MessageActions';
import { FileAttachmentPreview } from '../messages/FileAttachmentPreview';
import { userService } from '../../services/userService';
import { MessageInput } from '../messages/MessageInput';
import { shallowEqual } from 'react-redux';
import { Header } from '../ui/Header';

interface DMUser {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

const getOtherUserIdFromDMChannel = (channelName: string, currentUserId: string): string | null => {
  if (!channelName.startsWith('dm-')) return null;
  
  try {
    // Remove the 'dm-' prefix
    const channelNameWithoutPrefix = channelName.substring(3);
    
    // Find the position of the second UUID by looking for the pattern of hyphens
    const uuidLength = 36; // Standard UUID length
    const firstUuid = channelNameWithoutPrefix.substring(0, uuidLength);
    const secondUuid = channelNameWithoutPrefix.substring(uuidLength + 1); // +1 for the separator hyphen
    
    // Validate both UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(firstUuid) || !uuidRegex.test(secondUuid)) {
      console.error('Invalid UUID format in channel name:', channelName);
      return null;
    }

    // Return the UUID that isn't the current user's
    return firstUuid === currentUserId ? secondUuid : firstUuid;
  } catch (error) {
    console.error('Error parsing DM channel name:', error);
    return null;
  }
};

export function ChannelView() {
  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const { channelId } = useParams();
  const { channels, currentChannel } = useAppSelector((state) => state.channels);

  // Use shallowEqual for object comparison
  const messages = useAppSelector(
    (state) => {
      const channelMessages = currentChannel?.id ? state.messages.messages[currentChannel.id] : [];
      return channelMessages || [];
    },
    shallowEqual
  );

  // Force re-render on messages change
  const messageCount = messages.length;
  useEffect(() => {
    // Removed console log for component messages update
  }, [messageCount, currentChannel?.id]);

  const { isLoading } = useAppSelector((state) => state.messages);
  const { user } = useAppSelector((state) => state.auth);
  const members = useAppSelector(state => selectChannelMembers(state, channelId || ''));
  
  // Local state
  const [isJoining, setIsJoining] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<DMUser | null>(null);
  
  // Ref for message container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    return () => clearTimeout(scrollTimeout);
  }, [messages]); // Depend directly on messages

  // Set current channel based on route param
  useEffect(() => {
    async function initChannel() {
      if (!channelId || !channels.length || !user?.id) return;

      const channel = channels.find(c => c.id === channelId);
      if (!channel) return;

      try {
        // Fetch channel members first
        await dispatch(fetchChannelMembers(channelId));
        
        // Check if user is a member
        const isMember = members.some(member => member.user_id === user.id);
        
        // If this is a newly created channel (creator should be a member)
        const isCreator = channel.created_by === user.id;
        
        // Update channel with membership info
        const updatedChannel = {
          ...channel,
          is_member: isMember || isCreator // User is a member if they're in members list OR they created the channel
        };
        
        dispatch(setCurrentChannel(updatedChannel));

        // If user is the creator but not in members yet, join the channel
        if (isCreator && !isMember) {
          try {
            await channelService.joinChannel(channelId);
            // Refresh members after joining
            dispatch(fetchChannelMembers(channelId));
          } catch (error) {
            console.error('Error joining as creator:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing channel:', error);
      }
    }

    initChannel();
  }, [channelId, channels, user?.id, dispatch]);

  // Effect for channel initialization and realtime subscription
  useEffect(() => {
    let mounted = true;

    async function initializeChannel() {
      if (!currentChannel?.id) return;

      try {
        dispatch(setLoading(true));
        
        // Fetch initial messages
        const fetchedMessages = await messageService.getChannelMessages(currentChannel.id);
        if (mounted) {
          dispatch(setChannelMessages({ channelId: currentChannel.id, messages: fetchedMessages }));
        }

        // Set up realtime subscription
        if (mounted) {
          await realtimeService.subscribeToChannelMessages(currentChannel.id);
        }
      } catch (error) {
        console.error('Failed to initialize channel:', error);
      } finally {
        if (mounted) {
          dispatch(setLoading(false));
        }
      }
    }

    initializeChannel();

    return () => {
      mounted = false;
      if (currentChannel?.id) {
        realtimeService.unsubscribeFromChannelMessages(currentChannel.id);
      }
    };
  }, [currentChannel?.id, dispatch]);

  // Format timestamp to show full date and time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
  };

  // Render a message group (messages from the same user in sequence)
  const renderMessageGroup = (message: Message, index: number) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isFirstInGroup = !prevMessage || prevMessage.user_id !== message.user_id;
    const isEditing = editingMessageId === message.id;
    
    // Get the display name and initial safely
    const displayName = message.user?.full_name || message.user?.username || 'Unknown User';
    const userInitial = (message.user?.username?.[0] || 'U').toUpperCase();
    
    return (
      <div 
        key={message.id} 
        className={`flex items-start ${isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
      >
        <div className="flex min-w-0 w-full">
          {/* Avatar column - fixed width */}
          <div className="w-[50px] flex-shrink-0">
            {isFirstInGroup && (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                {userInitial}
              </div>
            )}
          </div>

          {/* Message content - flexible width */}
          <div className="flex-1 min-w-0">
            {isFirstInGroup && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{displayName}</span>
                <span className="text-xs text-gray-500">
                  {formatMessageTime(message.created_at)}
                </span>
              </div>
            )}
            <div className="group">
              {isEditing ? (
                <MessageActions
                  message={message}
                  currentUserId={user?.id || ''}
                  isEditing={true}
                  onStartEdit={() => setEditingMessageId(message.id)}
                  onFinishEdit={() => setEditingMessageId(null)}
                />
              ) : (
                <>
                  <div className="relative w-full pr-4">
                    <div className="text-gray-900 break-words pr-24">
                      {message.content && <MessageContent content={message.content} />}
                      {message.file_attachment && (
                        <FileAttachmentPreview attachment={message.file_attachment} />
                      )}
                    </div>
                    {/* Edited tag - always on the far right */}
                    {message.is_edited && (
                      <div className="absolute right-4 top-0">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          (edited)
                        </span>
                      </div>
                    )}
                    {/* Message actions - positioned to the left of edited tag */}
                    {!isEditing && (
                      <div className="absolute right-16 top-0">
                        <MessageActions
                          message={message}
                          currentUserId={user?.id || ''}
                          isEditing={false}
                          onStartEdit={() => setEditingMessageId(message.id)}
                          onFinishEdit={() => setEditingMessageId(null)}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleJoinChannel = async () => {
    if (!currentChannel || !user) return;
    
    try {
      setIsJoining(true);
      await channelService.joinChannel(currentChannel.id);
      // Always refresh the channel state after attempting to join
      const updatedChannel = await channelService.getChannel(currentChannel.id);
      if (updatedChannel) {
        dispatch(setCurrentChannel(updatedChannel));
      }
    } catch (error) {
      console.error('Failed to join channel:', error);
    } finally {
      setIsJoining(false);
    }
  };

  // Auto-join general channel when viewed
  useEffect(() => {
    async function autoJoinGeneralChannel() {
      if (
        currentChannel?.name === 'general' &&
        !currentChannel.is_member &&
        currentChannel.type === 'public'
      ) {
        try {
          setIsJoining(true);
          await channelService.joinChannel(currentChannel.id);
          
          // Always refresh the channel state, even if we were already a member
          const updatedChannel = await channelService.getChannel(currentChannel.id);
          if (updatedChannel) {
            dispatch(setCurrentChannel(updatedChannel));
          }
        } catch (error) {
          console.error('Failed to auto-join general channel:', error);
        } finally {
          setIsJoining(false);
        }
      }
    }

    if (currentChannel?.name === 'general') {
      autoJoinGeneralChannel();
    }
  }, [currentChannel?.id, currentChannel?.name, currentChannel?.type, dispatch]);

  // Update the effect that fetches the other user's info
  useEffect(() => {
    async function fetchOtherUser() {
      if (!currentChannel || !user?.id) return;
      if (currentChannel.type !== 'direct' || !currentChannel.name) return;
      
      const otherUserId = getOtherUserIdFromDMChannel(currentChannel.name, user.id);
      if (!otherUserId) return;

      try {
        const userData = await userService.getUserById(otherUserId);
        setOtherUser({
          id: userData.id,
          username: userData.username || 'unknown',
          full_name: userData.full_name,
          avatar_url: userData.avatar_url
        });
      } catch (error) {
        console.error('Failed to fetch other user:', error);
      }
    }

    fetchOtherUser();
  }, [currentChannel?.type, currentChannel?.name, user?.id]);

  // Add effect to fetch channel members
  useEffect(() => {
    if (channelId && currentChannel?.is_member) {
      dispatch(fetchChannelMembers(channelId));
    }
  }, [channelId, currentChannel?.is_member, dispatch]);

  if (!currentChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to ChatGenius! 👋
          </h2>
          <p className="text-gray-600">
            You'll be automatically connected to the #general channel in a moment.
            {import.meta.env.VITE_API_URL?.includes('render.com') && (
              <span className="block mt-2 text-sm text-gray-500">
                Note: First connection may take up to 30 seconds while our server wakes up. Thanks for your patience! 🚀
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Show join prompt for public channels when not a member
  if (!currentChannel.is_member && currentChannel.type === 'public') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to #{currentChannel.name}
          </h2>
          <p className="text-gray-600 mb-4">
            {currentChannel.description || `This is the beginning of the ${currentChannel.name} channel.`}
          </p>
          {currentChannel.name === 'general' ? (
            <div className="text-sm text-gray-500 mb-4">
              <div className="animate-pulse">Joining channel...</div>
            </div>
          ) : (
            <Button
              onClick={handleJoinChannel}
              disabled={isJoining}
              className="w-full justify-center"
            >
              {isJoining ? 'Joining...' : 'Join Channel'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <Header 
        channelName={currentChannel.type === 'direct' 
          ? (otherUser?.full_name || otherUser?.username || 'Unknown User')
          : currentChannel.name
        }
        channelId={currentChannel.id}
        topic={currentChannel.type === 'direct' 
          ? `@${otherUser?.username || ''}`
          : currentChannel.description
        }
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">Be the first to send a message!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 py-4">
            {messages.map((message, index) => renderMessageGroup(message, index))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput 
        channelId={channelId || ''} 
        disabled={!currentChannel?.is_member}
        placeholder={currentChannel?.is_member 
          ? `Message ${currentChannel?.type === 'direct' ? otherUser?.full_name || 'user' : '#' + currentChannel?.name}`
          : 'You must join this channel to send messages'
        }
      />
    </div>
  );
} 