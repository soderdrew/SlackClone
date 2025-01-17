import { FC, Fragment, useState, useCallback, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentPlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Profile } from '../../types/user';
import { avatarDocumentService } from '../../services/avatarDocumentService';
import { AvatarDocument } from '../../types/documents';
import { supabase } from '../../lib/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (bio: string) => Promise<void>;
}

export const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [bio, setBio] = useState(profile.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [documents, setDocuments] = useState<AvatarDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(bio);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await avatarDocumentService.getUserDocuments(profile.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile.id]);

  // Load documents when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, loadDocuments]);

  // Subscribe to document status changes
  useEffect(() => {
    if (!isOpen) return;

    const subscription = supabase
      .channel('avatar_documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'avatar_documents',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          // Update documents based on the change type
          if (payload.eventType === 'INSERT') {
            setDocuments(prev => [payload.new as AvatarDocument, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev => 
              prev.map(doc => 
                doc.id === payload.new.id ? payload.new as AvatarDocument : doc
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, profile.id]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      setIsLoading(true);
      await avatarDocumentService.uploadDocument(file);
      await loadDocuments(); // Reload the documents list
    } catch (error: any) {
      setUploadError(error.message);
      console.error('Error uploading document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (document: AvatarDocument) => {
    try {
      setIsLoading(true);
      await avatarDocumentService.deleteDocument(document);
      await loadDocuments(); // Reload the documents list
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Edit or Build your AI Avatar
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    className="p-1 hover:bg-gray-100 rounded-full"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Profile Picture */}
                  <div className="flex justify-center">
                    <div className="w-24 h-24">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-medium">
                          {profile.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                      AI Avatar Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={4}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        AI Avatar Documents
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          className="hidden"
                          id="document-upload"
                          onChange={handleFileUpload}
                          accept=".txt,.md,.pdf,.json,.csv"
                        />
                        <label
                          htmlFor="document-upload"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                        >
                          <DocumentPlusIcon className="w-4 h-4 mr-1" />
                          Upload
                        </label>
                      </div>
                    </div>

                    {uploadError && (
                      <p className="text-sm text-red-600">{uploadError}</p>
                    )}

                    {/* Documents List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {isLoading ? (
                        <p className="text-sm text-gray-500">Loading documents...</p>
                      ) : documents.length === 0 ? (
                        <p className="text-sm text-gray-500">No documents uploaded yet</p>
                      ) : (
                        documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {doc.embedding_status === 'completed' ? 'Ready' : 'Processing...'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              className="p-1 hover:bg-gray-200 rounded-full ml-2"
                              onClick={() => handleDeleteDocument(doc)}
                            >
                              <TrashIcon className="h-4 w-4 text-gray-500" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 