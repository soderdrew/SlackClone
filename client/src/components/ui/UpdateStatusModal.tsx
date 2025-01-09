import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { UserStatus } from '../../types/user';
import { userService } from '../../services/userService';
import { StatusIndicator } from './StatusIndicator';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus?: UserStatus;
  currentStatusMessage?: string;
  userId: string;
}

const statusOptions: { status: UserStatus; label: string }[] = [
  { status: 'online', label: 'Online' },
  { status: 'away', label: 'Away' },
  { status: 'busy', label: 'Do not disturb' },
  { status: 'invisible', label: 'Invisible' }
];

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
    isOpen,
    onClose,
    currentStatus = 'online',
    currentStatusMessage = '',
    userId
  }) => {
    const [status, setStatus] = useState<UserStatus>(currentStatus);
    const [statusMessage, setStatusMessage] = useState(currentStatusMessage);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleUpdateStatus = async () => {
      try {
        setIsUpdating(true);
        setError(null);
        await userService.updateUserStatus(userId, {
          status,
          status_message: statusMessage
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsUpdating(false);
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
            <div className="fixed inset-0 bg-gray-500 bg-opacity-25 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                  <div className="px-6 pt-6 pb-6 bg-white">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 mb-4">
                      Update your status
                    </Dialog.Title>
                    
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 rounded-full p-1 bg-white hover:bg-gray-100 border border-gray-300 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
  
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="What's your status?"
                          value={statusMessage}
                          onChange={(e) => setStatusMessage(e.target.value)}
                          maxLength={100}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                            placeholder-gray-400 bg-white"
                        />
                        {statusMessage && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            {100 - statusMessage.length}
                          </span>
                        )}
                      </div>
  
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Set your status
                      </div>
  
                      <div className="space-y-1">
                        {statusOptions.map((option) => (
                          <button
                            key={option.status}
                            onClick={() => setStatus(option.status)}
                            className={`w-full flex items-center px-3 py-2 rounded-md border transition-colors
                              ${status === option.status 
                                ? 'bg-blue-50 text-blue-700 border-blue-500' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          >
                            <StatusIndicator status={option.status} size="sm" />
                            <span className="ml-2">{option.label}</span>
                          </button>
                        ))}
                      </div>
  
                      {error && (
                        <div className="text-sm text-red-600 mt-2">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
  
                  <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                        rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={isUpdating}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        ${isUpdating 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {isUpdating ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  };
  