import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { Channel } from '../../types/channel';
import { PlusIcon } from '@heroicons/react/24/outline';
import { StartDMModal } from '../messages/StartDMModal';
import { userService } from '../../services/userService';
import { realtimeService } from '../../services/realtimeService';

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
  const { channels } = useAppSelector((state) => state.channels);
  const { user } = useAppSelector((state) => state.auth);
  const [isDMsExpanded, setIsDMsExpanded] = useState(true);
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  const [isStartDMModalOpen, setIsStartDMModalOpen] = useState(false);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [dmChannels, setDmChannels] = useState<DMChannel[]>([]);

  // Initialize subscriptions when user logs in
  useEffect(() => {
    if (user?.id) {
      // Subscribe to DM message updates
      realtimeService.subscribeToDMUpdates(user.id);
      // Subscribe to channel updates (including new DMs)
      realtimeService.subscribeToChannels(user.id);
    }

    return () => {
      // Cleanup will be handled by realtimeService's cleanup method
    };
  }, [user?.id]);

  // Process DM channels when channels or user changes
  useEffect(() => {
    const loadDMChannels = async () => {
      if (user && channels.length > 0) {
        console.log('Processing DM channels:', {
          channelCount: channels.length,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        const processed = await processDMChannels(channels, user.id);
        setDmChannels(processed);
      }
    };

    loadDMChannels();
  }, [channels, user]);

  // Separate regular channels
  const regularChannels = channels.filter(channel => channel.type !== 'direct');

  return (
    <div className="w-64 bg-gray-900 flex-shrink-0 h-full flex flex-col">
      {/* Header */}
      <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4">
        <h1 className="text-white font-semibold text-lg">ChatGenius</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
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
              {regularChannels.map((channel) => (
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
                onClick={() => setIsAddChannelModalOpen(true)}
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
              {dmChannels.map((dm) => (
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
    </div>
  );
} 