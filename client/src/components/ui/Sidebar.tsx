import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { Channel } from '../../types/channel';
import { PlusIcon } from '@heroicons/react/24/outline';
import { StartDMModal } from '../messages/StartDMModal';
import { CreateChannelModal } from '../channels/CreateChannelModal';
import { userService } from '../../services/userService';
import { realtimeService } from '../../services/realtimeService';
import { SearchBar } from './SearchBar';
import { StatusIndicator } from './StatusIndicator';
import { UpdateStatusModal } from './UpdateStatusModal';
import { UserStatus, UserPresence } from '../../types/user';
import { usePresenceSubscription } from '../../hooks/usePresenceSubscription';

interface DMChannel extends Channel {
  displayName: string;
  username: string;
  avatar_url?: string;
}

// Add this function to process DM channels
const processDMChannels = async (channels: Channel[], currentUserId: string): Promise<DMChannel[]> => {
  const processedChannels = await Promise.all(channels
    .filter(channel => channel.type === 'direct')
    .map(async channel => {
      const defaultResult = {
        ...channel,
        displayName: 'Unknown User',
        username: '',
        avatar_url: undefined
      };

      try {
        // Remove 'dm-' prefix and split into two UUIDs
        const matches = channel.name
          .substring(3) // Remove 'dm-'
          .match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);

        if (!matches || matches.length !== 2) {
          return defaultResult;
        }

        const [firstUserId, secondUserId] = matches;
        // Get the other user's ID (the one that's not the current user)
        const otherUserId = firstUserId === currentUserId ? secondUserId : firstUserId;
        
        // Fetch the other user's information directly
        const otherUser = await userService.getUserById(otherUserId);
        
        return {
          ...channel,
          displayName: otherUser.full_name || otherUser.username || 'Unknown User',
          username: otherUser.username || '',
          avatar_url: otherUser.avatar_url
        };
      } catch (error) {
        console.error('Error processing DM channel:', error);
        return defaultResult;
      }
    }));

  return processedChannels;
};

export function Sidebar() {
  const dispatch = useAppDispatch();
  const [isStartDMModalOpen, setIsStartDMModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('online');
  const [currentStatusMessage, setCurrentStatusMessage] = useState<string>('');
  const [isDMsExpanded, setIsDMsExpanded] = useState(true);
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = useAppSelector(state => state.auth.user);
  const channels = useAppSelector(state => state.channels.channels);
  const [dmChannels, setDMChannels] = useState<DMChannel[]>([]);

  // Handle presence updates
  const handlePresenceUpdate = useCallback((update: { id: string; presence: UserPresence }) => {
    if (currentUser?.id === update.id) {
      setCurrentStatus(update.presence.status);
      setCurrentStatusMessage(update.presence.status_message || '');
    }
  }, [currentUser?.id]); // Only depend on currentUser.id

  // Subscribe to presence updates
  usePresenceSubscription(handlePresenceUpdate);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      if (currentUser?.id) {
        try {
          const presence = await userService.getCurrentUserStatus();
          setCurrentStatus(presence.status);
          setCurrentStatusMessage(presence.status_message || '');
        } catch (error) {
          console.error('Failed to fetch current status:', error);
        }
      }
    };
    fetchCurrentStatus();
  }, [currentUser?.id]);

  // Initialize subscriptions when user logs in
  useEffect(() => {
    if (currentUser?.id) {
      // Subscribe to DM message updates
      realtimeService.subscribeToDMUpdates(currentUser.id);
      // Subscribe to channel updates (including new DMs)
      realtimeService.subscribeToChannels(currentUser.id);
    }

    return () => {
      // Cleanup will be handled by realtimeService's cleanup method
    };
  }, [currentUser?.id]);

  // Process DM channels when channels or user changes
  useEffect(() => {
    const loadDMChannels = async () => {
      if (currentUser && channels.length > 0) {
        const processed = await processDMChannels(channels, currentUser.id);
        setDMChannels(processed);
      }
    };

    loadDMChannels();
  }, [channels, currentUser]);

  // Separate regular channels
  const regularChannels = channels.filter(channel => channel.type !== 'direct');

  // Filter channels and DMs based on search query
  const filteredRegularChannels = regularChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDMChannels = dmChannels.filter(dm =>
    dm.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dm.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-900 text-white w-64 flex-shrink-0 h-screen overflow-y-auto">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Workspace Name</h1>
        
        {/* Status Button */}
        <button
          onClick={() => setIsStatusModalOpen(true)}
          className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 w-full"
        >
          <StatusIndicator status={currentStatus} />
          <span className="text-sm truncate">
            {currentStatusMessage || 'Set a status'}
          </span>
        </button>

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search channels..."
          className="mb-4"
        />

        {/* Channels Section */}
        <div className="px-3 py-2">
          <button
            onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
            className="flex items-center justify-between w-full text-gray-300 hover:text-white mb-1"
          >
            <span className="text-sm font-medium">Channels</span>
            <span className="text-gray-400">{isChannelsExpanded ? '▼' : '▶'}</span>
          </button>
          {isChannelsExpanded && (
            <div className="space-y-1">
              {filteredRegularChannels.map((channel) => (
                <Link
                  key={channel.id}
                  to={`/channels/${channel.id}`}
                  className={`
                    flex items-center px-2 py-1 text-sm
                    ${channels.find(c => c.id === channel.id)?.id === channel.id
                      ? 'text-white bg-gray-800'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }
                    rounded transition-colors
                  `}
                >
                  <span className="mr-1">#</span>
                  <span className="truncate">{channel.name}</span>
                </Link>
              ))}
              <button
                onClick={() => setIsCreateChannelModalOpen(true)}
                className="flex items-center w-full px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Channel
              </button>
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div className="px-3 py-2">
          <button
            onClick={() => setIsDMsExpanded(!isDMsExpanded)}
            className="flex items-center justify-between w-full text-gray-300 hover:text-white mb-1"
          >
            <span className="text-sm font-medium">Direct Messages</span>
            <span className="text-gray-400">{isDMsExpanded ? '▼' : '▶'}</span>
          </button>
          {isDMsExpanded && (
            <div className="space-y-1">
              <button
                onClick={() => setIsStartDMModalOpen(true)}
                className="flex items-center w-full px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Start a New Message
              </button>
              {filteredDMChannels.map((dm) => (
                <Link
                  key={dm.id}
                  to={`/channels/${dm.id}`}
                  className={`
                    flex items-center px-2 py-1 text-sm
                    ${channels.find(c => c.id === dm.id)?.id === dm.id
                      ? 'text-white bg-gray-800'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }
                    rounded transition-colors
                  `}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center mr-2 flex-shrink-0">
                    {dm.avatar_url ? (
                      <img
                        src={dm.avatar_url}
                        alt={dm.displayName}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <span className="text-xs text-white">
                        {dm.displayName[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{dm.displayName}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <StartDMModal
        isOpen={isStartDMModalOpen}
        onClose={() => setIsStartDMModalOpen(false)}
      />
      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setIsCreateChannelModalOpen(false)}
      />

      {/* Status Modal */}
      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentStatus={currentStatus}
        currentStatusMessage={currentStatusMessage}
        userId={currentUser?.id || ''}
      />
    </div>
  );
} 