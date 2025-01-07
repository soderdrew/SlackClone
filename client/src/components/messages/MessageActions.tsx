import { useState } from 'react';
import { Message } from '../../types/message';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tooltip } from '../ui/Tooltip';
import { messageService } from '../../services/messageService';
import { useAppDispatch } from '../../hooks/redux';
import { updateMessage, deleteMessage } from '../../features/messages/messagesSlice';

interface MessageActionsProps {
  message: Message;
  currentUserId: string;
  onStartEdit: () => void;
  onFinishEdit: () => void;
  isEditing: boolean;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteModal({ isOpen, onClose, onConfirm, isLoading }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-medium mb-4">Delete Message?</h3>
        <p className="text-gray-500 mb-6">This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MessageActions({ 
  message, 
  currentUserId, 
  onStartEdit,
  onFinishEdit,
  isEditing 
}: MessageActionsProps) {
  const dispatch = useAppDispatch();
  const [editedContent, setEditedContent] = useState(message.content);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isOwner = message.user_id === currentUserId;

  const handleEdit = async () => {
    if (!isEditing) {
      setEditedContent(message.content);
      onStartEdit();
      return;
    }

    if (editedContent.trim() === message.content) {
      onFinishEdit();
      return;
    }

    try {
      setIsLoading(true);
      const updatedMessage = await messageService.updateMessage(message.id, editedContent.trim());
      dispatch(updateMessage(updatedMessage));
      onFinishEdit();
    } catch (error) {
      console.error('Failed to update message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await messageService.deleteMessage(message.id);
      dispatch(deleteMessage({ channelId: message.channel_id, messageId: message.id }));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      onFinishEdit();
      setEditedContent(message.content);
    }
  };

  if (!isOwner) return null;

  if (isEditing) {
    return (
      <div className="w-full">
        <Input
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="w-full"
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            onClick={handleEdit}
            disabled={isLoading || editedContent.trim() === message.content}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onFinishEdit();
              setEditedContent(message.content);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="inline-flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="text-[11px] text-gray-700 bg-white hover:bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={isLoading}
          className="text-[11px] text-gray-700 bg-white hover:bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 transition-colors"
        >
          Delete
        </button>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  );
} 