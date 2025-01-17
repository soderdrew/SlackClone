import { FC, useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { Button } from '../ui/Button';
import { Profile } from '../../types/user';
import { avatarDocumentService } from '../../services/avatarDocumentService';
import { AvatarChatModal } from './AvatarChatModal';

interface AvatarChatButtonProps {
  profile: Profile;
  className?: string;
}

export const AvatarChatButton: FC<AvatarChatButtonProps> = ({ profile, className = '' }) => {
  const [hasDocuments, setHasDocuments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDocuments = async () => {
      try {
        const documents = await avatarDocumentService.getUserDocuments(profile.id);
        setHasDocuments(documents.some(doc => doc.embedding_status === 'completed'));
      } catch (error) {
        console.error('Error checking documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkDocuments();
  }, [profile.id]);

  if (isLoading || !hasDocuments) return null;

  return (
    <>
      <Button
        variant="ghost"
        className={`p-1 hover:bg-gray-100 rounded-full ${className}`}
        onClick={() => setIsModalOpen(true)}
        title={`Chat with ${profile.username}'s AI Avatar`}
      >
        <SparklesIcon className="h-4 w-4 text-blue-500" />
      </Button>

      <AvatarChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
      />
    </>
  );
}; 