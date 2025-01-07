import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Message, SendMessageData } from '../../types/message';
import { addMessage, setChannelMessages, setLoading } from '../../features/messages/messagesSlice';
import { setCurrentChannel } from '../../features/channels/channelsSlice';
import { messageService } from '../../services/messageService';
import { channelService } from '../../services/channelService';
import { realtimeService } from '../../services/realtimeService';
import { formatDistanceToNow } from 'date-fns';
import { MessageContent } from '../messages/MessageContent';
import { MessageActions } from '../messages/MessageActions';

export function ChannelView() {
  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const { channelId } = useParams();
  const { channels, currentChannel } = useAppSelector((state) => state.channels);
  const { messages: messagesByChannel, isLoading } = useAppSelector((state) => state.messages);
  const { user } = useAppSelector((state) => state.auth);
  
  // Local state for new message input
  const [newMessage, setNewMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  // Ref for message container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set current channel based on route param
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const channel = channels.find(c => c.id === channelId);
      if (channel) {
        dispatch(setCurrentChannel(channel));
      }
    }
  }, [channelId, channels, dispatch]);

  // Get messages for current channel
  const currentMessages: Message[] = currentChannel ? messagesByChannel[currentChannel.id] || [] : [];

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Load messages when channel changes
  useEffect(() => {
    async function loadMessages() {
      if (!currentChannel) return;
      if (!currentChannel.is_member && currentChannel.type === 'public') return;

      try {
        dispatch(setLoading(true));
        const messages: Message[] = await messageService.getChannelMessages(currentChannel.id);
        dispatch(setChannelMessages({ channelId: currentChannel.id, messages }));
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadMessages();
  }, [currentChannel?.id, currentChannel?.is_member, dispatch]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChannel || !user) return;

    try {
      const messageData: SendMessageData = {
        content: newMessage,
        channel_id: currentChannel.id,
      };

      const message: Message = await messageService.sendMessage(messageData);
      dispatch(addMessage(message));
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

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
    const prevMessage = index > 0 ? currentMessages[index - 1] : null;
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
                  <div className="flex justify-between items-start group pr-4">
                    <div className="text-gray-900 break-words flex-1 mr-4">
                      <MessageContent content={message.content} />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {message.is_edited && (
                        <span className="text-xs text-gray-500">
                          (edited)
                        </span>
                      )}
                      {!isEditing && (
                        <MessageActions
                          message={message}
                          currentUserId={user?.id || ''}
                          isEditing={false}
                          onStartEdit={() => setEditingMessageId(message.id)}
                          onFinishEdit={() => setEditingMessageId(null)}
                        />
                      )}
                    </div>
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
          const response = await channelService.joinChannel(currentChannel.id);
          
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

  // Subscribe to real-time updates when channel changes
  useEffect(() => {
    if (!currentChannel?.id || !currentChannel.is_member) return;

    // Subscribe to real-time updates
    realtimeService.subscribeToChannelMessages(currentChannel.id);

    // Cleanup subscription when component unmounts or channel changes
    return () => {
      realtimeService.unsubscribeFromChannelMessages(currentChannel.id);
    };
  }, [currentChannel?.id, currentChannel?.is_member]);

  if (!currentChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to ChatGenius! 👋
          </h2>
          <p className="text-gray-600">
            You'll be automatically connected to the #general channel in a moment.
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
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">Be the first to send a message!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 py-4">
            {currentMessages.map((message, index) => renderMessageGroup(message, index))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex w-full">
          <div className="flex w-full space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${currentChannel.name}`}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isLoading}
              className="px-6 whitespace-nowrap flex-shrink-0"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 