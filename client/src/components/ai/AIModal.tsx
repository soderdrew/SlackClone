import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { aiService } from '../../services/aiService';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

export function AIModal({ isOpen, onClose, channelId }: AIModalProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setResponse(null);
      
      const answer = await aiService.askQuestion(question, channelId);
      setResponse(answer);
      
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
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{response}</p>
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