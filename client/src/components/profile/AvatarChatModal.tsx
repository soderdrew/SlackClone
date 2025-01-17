import { FC, Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Profile } from '../../types/user';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { API_BASE_URL } from '../../config/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface AvatarChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export const AvatarChatModal: FC<AvatarChatModalProps> = ({ isOpen, onClose, profile }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get auth token from Redux store
  const token = useSelector((state: RootState) => state.auth.token);

  // Reset state when modal closes
  const handleClose = () => {
    setQuery('');
    setResponse(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      setIsLoading(true);
      setError(null);
      
      const res = await fetch(`${API_BASE_URL}/api/ai/avatar/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: query.trim(),
          userId: profile.id
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to get response: ${await res.text()}`);
      }
      
      try {
        const data = await res.json();
        setResponse(data.formattedResponse);
        setQuery(''); // Clear input after successful response
      } catch (parseError) {
        throw new Error(`Invalid JSON response`);
      }
    } catch (error: any) {
      console.error('Error getting avatar response:', error);
      setError(error.message || 'Sorry, I encountered an error while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 flex items-center">
                    <SparklesIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Chat with {profile.username}'s AI Avatar
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    className="p-1 hover:bg-gray-100 rounded-full"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Initial Message */}
                  {!response && !error && (
                    <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
                      👋 Hi! I'm {profile.username}'s AI Avatar. Ask me anything about their background, experience, or expertise.
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Response Display */}
                  {response && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 whitespace-pre-wrap">
                      {response}
                    </div>
                  )}

                  {/* Query Input Form */}
                  <form onSubmit={handleSubmit} className="mt-4">
                    <div className="flex items-start space-x-2">
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask me anything..."
                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="mt-1"
                      >
                        {isLoading ? 'Thinking...' : 'Ask'}
                      </Button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 