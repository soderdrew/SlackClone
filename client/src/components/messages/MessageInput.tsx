import { useState, KeyboardEvent, useRef } from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { setError } from '../../features/messages/messagesSlice';
import { messageService } from '../../services/messageService';
import { fileService } from '../../services/fileService';
import { useToast } from '../../hooks/useToast';
import { PaperClipIcon, XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface MessageInputProps {
  channelId: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ channelId, placeholder = 'Type a message...', disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 50MB file size limit
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if ((!message.trim() && !selectedFile) || isLoading) return;

    try {
      setIsLoading(true);
      let fileAttachment;

      if (selectedFile) {
        fileAttachment = await fileService.uploadFile(selectedFile);
      }

      await messageService.sendMessage({
        content: message.trim(),
        channel_id: channelId,
        file: selectedFile || undefined,
      });

      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        {selectedFile && (
          <div className="absolute left-2 -top-8 flex items-center gap-2 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm">
            {selectedFile.type.startsWith('image/') ? (
              <PhotoIcon className="h-4 w-4" />
            ) : (
              <DocumentIcon className="h-4 w-4" />
            )}
            <span className="max-w-[200px] truncate">{selectedFile.name}</span>
            <button
              onClick={handleRemoveFile}
              className="bg-white hover:bg-gray-200 rounded-full p-0.5 shadow-sm border border-gray-200"
              title="Remove file"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
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
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white p-1 hover:bg-gray-100 rounded-full shadow-sm border border-gray-200"
            title="Attach file"
          >
            <PaperClipIcon className="h-5 w-5 text-gray-500" />
          </button>
          <span className="text-xs text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
} 