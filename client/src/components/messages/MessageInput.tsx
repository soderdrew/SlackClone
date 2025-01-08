import { useState, KeyboardEvent } from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { setError } from '../../features/messages/messagesSlice';
import { messageService } from '../../services/messageService';
import { useToast } from '../../hooks/useToast';

interface MessageInputProps {
  channelId: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ channelId, placeholder = 'Type a message...', disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;

    try {
      setIsLoading(true);
      await messageService.sendMessage({
        content: message.trim(),
        channel_id: channelId,
      });
      setMessage('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900"
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <div className="absolute right-2 bottom-2 text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
} 