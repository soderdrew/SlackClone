import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { aiService } from '../../services/aiService';
import { userService } from '../../services/userService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Channel } from '../../types/channel';
import { User } from '../../types/user';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

interface Source {
  content: string;
  createdAt: string;
  userId: string;
  channelId: string;
  score: number;
  isEdited?: boolean;
}

// Selectors
const selectUserById = (state: RootState, userId: string): User | undefined => {
  // If the current user matches the userId, return from auth.user
  if (state.auth.user?.id === userId) {
    // Map the auth user to our application User type
    return {
      id: state.auth.user.id,
      username: state.auth.user.email?.split('@')[0] || 'unknown',
      avatar_url: state.auth.user.user_metadata?.avatar_url,
      full_name: state.auth.user.user_metadata?.full_name,
      presence: { 
        status: 'online',
        online_at: new Date().toISOString(),
        status_message: 'Available'
      }
    };
  }
  // For other users, we'll need to get them from the channel members
  const allChannelMembers = Object.values(state.channels.channelMembers).flat();
  return allChannelMembers.find(member => member.user_id === userId)?.user;
};

const selectChannelById = (state: RootState, channelId: string): Channel | undefined =>
  state.channels.channels.find(channel => channel.id === channelId);

export function AIModal({ isOpen, onClose, channelId }: AIModalProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setResponse(null);
      setSources([]);
      
      const result = await aiService.askQuestion(question, channelId);
      setResponse(result.answer);
      setSources(result.sources);
      
    } catch (error) {
      console.error('Error asking AI:', error);
      setResponse('Sorry, I encountered an error while processing your question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQuestion('');
    setResponse(null);
    setSources([]);
    onClose();
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
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    AI Assistant
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    className="p-1 hover:bg-gray-100 rounded-full"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>

                <div className="mt-4">
                  <div className="space-y-4">
                    {!response && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Ask me anything about the conversation in this channel. I can help you:
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          <li>• Find specific messages or topics</li>
                          <li>• Summarize recent discussions</li>
                          <li>• Answer questions about past conversations</li>
                          <li>• Provide context for decisions or updates</li>
                        </ul>
                      </div>
                    )}

                    {response && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{response}</p>
                        </div>

                        {sources.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Sources</h4>
                            <div className="space-y-2">
                              {sources.map((source, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <div className="flex-shrink-0 text-xs font-medium text-gray-500 mt-1">
                                    [{index + 1}]
                                  </div>
                                  <SourceItem source={source} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <textarea
                        className="w-full h-24 p-3 bg-[#f2f2f2] text-gray-900 rounded-lg resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Type your question here..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!question.trim() || isLoading}
                  >
                    {isLoading ? 'Thinking...' : 'Ask AI'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function SourceItem({ source }: { source: Source }) {
  const channel = useSelector((state: RootState) => selectChannelById(state, source.channelId));
  const [user, setUser] = useState<User | null>(null);
  const date = new Date(source.createdAt).toLocaleString();
  const relevancePercentage = Math.round(source.score * 100);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getUserById(source.userId);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [source.userId]);

  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="flex items-start justify-between gap-x-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{source.content}</p>
          <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
            <span>{user?.full_name || user?.username || 'Unknown user'}</span>
            <span>•</span>
            <span>{channel?.name ? `#${channel.name}` : 'Unknown channel'}</span>
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>
        <div className="flex-shrink-0 w-[1px] h-full min-h-[40px] bg-gray-200 mx-2 self-stretch" />
        <div className="flex-shrink-0">
          <div className="text-xs font-medium text-gray-500">
            {relevancePercentage}% match
          </div>
        </div>
      </div>
    </div>
  );
} 