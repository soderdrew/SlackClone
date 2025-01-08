import { useState, useEffect } from 'react';
import { FileAttachment } from '../../types/message';
import { fileService } from '../../services/fileService';
import { DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface FileAttachmentPreviewProps {
  attachment: FileAttachment;
}

export function FileAttachmentPreview({ attachment }: FileAttachmentPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = attachment.mimeType.startsWith('image/');

  useEffect(() => {
    const loadFileUrl = async () => {
      try {
        const fileUrl = await fileService.getFileUrl(attachment.path);
        setUrl(fileUrl);
      } catch (error) {
        console.error('Error loading file URL:', error);
      }
    };

    loadFileUrl();
  }, [attachment.path]);

  if (!url) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mt-2 max-w-sm">
      {isImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={url}
            alt={attachment.filename}
            className="max-h-48 rounded-lg object-cover"
          />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
        >
          {attachment.mimeType.includes('pdf') ? (
            <DocumentIcon className="h-8 w-8 text-red-500" />
          ) : (
            <DocumentIcon className="h-8 w-8 text-blue-500" />
          )}
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
            <p className="text-sm text-gray-500">{formatFileSize(attachment.size)}</p>
          </div>
        </a>
      )}
    </div>
  );
} 