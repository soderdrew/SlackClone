import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Message, SendMessageData } from '../../types/message';
import { addMessage, setChannelMessages, setLoading } from '../../features/messages/messagesSlice';
import { setCurrentChannel } from '../../features/channels/channelsSlice';
import { messageService } from '../../services/messageService';
import { formatDistanceToNow } from 'date-fns';

export function ChannelView() {
  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const { channelId } = useParams();
  const { channels, currentChannel } = useAppSelector((state) => state.channels);
  const { messages: messagesByChannel, isLoading } = useAppSelector((state) => state.messages);
  const { user } = useAppSelector((state) => state.auth);
  
  // Local state for new message input
  const [newMessage, setNewMessage] = useState('');
  
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
  }, [currentChannel?.id, dispatch]);

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
    
    return (
      <div 
        key={message.id} 
        className={`flex items-start ${isFirstInGroup ? 'mt-6' : 'mt-1'}`}
      >
        <div className="flex min-w-0 w-full">
          {/* Avatar column - fixed width */}
          <div className="w-[50px] flex-shrink-0">
            {isFirstInGroup && (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                {message.user.username[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Message content - flexible width */}
          <div className="flex-1 min-w-0">
            {isFirstInGroup && (
              <div className="flex items-baseline">
                <span className="font-medium text-gray-900">{message.user.full_name || message.user.username}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline group">
              <div className="text-gray-900 break-words">
                {message.content}
                {message.is_edited && (
                  <span className="text-xs text-gray-500 ml-2">(edited)</span>
                )}
              </div>
              <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                {formatMessageTime(message.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Select a channel to start chatting</p>
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