import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { Channel } from '../../types/channel';
import { PlusIcon } from '@heroicons/react/24/outline';
import { StartDMModal } from '../messages/StartDMModal';

interface DMChannel extends Channel {
  displayName: string;
  username: string;
  avatar_url?: string;
}

// Add this function to process DM channels
const processDMChannels = (channels: Channel[], currentUserId: string): DMChannel[] => {
  return channels
    .filter(channel => channel.type === 'direct')
    .map(channel => {
      // Get the other user's ID from the channel name
      const otherUserId = channel.name.substring(3).split('-').find(id => id !== currentUserId);
      
      // Find the other user's info from channel members
      const otherUserMember = channel.channel_members?.find(
        member => member.user_id === otherUserId
      );
      
      // Get the profile information from the member
      const otherUserProfile = otherUserMember?.profiles;
      
      // For debugging
      console.log('Processing DM channel:', {
        channelName: channel.name,
        otherUserId,
        members: channel.channel_members,
        otherUserMember,
        profile: otherUserProfile
      });

      return {
        ...channel,
        displayName: otherUserProfile?.full_name || otherUserProfile?.username || 'Unknown User',
        username: otherUserProfile?.username || '',
        avatar_url: otherUserProfile?.avatar_url
      };
    });
};

export function Sidebar() {
  const { channels } = useAppSelector((state) => state.channels);
  const { user } = useAppSelector((state) => state.auth);
  const [isDMsExpanded, setIsDMsExpanded] = useState(true);
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  const [isStartDMModalOpen, setIsStartDMModalOpen] = useState(false);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);

  // Separate regular channels and DMs
  const regularChannels = channels.filter(channel => channel.type !== 'direct');
  const dmChannels = user ? processDMChannels(channels, user.id) : [];

  return (
    <div className="w-64 bg-gray-900 flex-shrink-0 h-full flex flex-col">
      {/* Header */}
      <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4">
        <h1 className="text-white font-semibold text-lg">ChatGenius</h1>
      </div>

      {/* Direct Messages Section */}
      <div className="flex-1 overflow-y-auto">
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

        {/* Regular Channels Section */}
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
      </div>

      {/* Modals */}
      <StartDMModal
        isOpen={isStartDMModalOpen}
        onClose={() => setIsStartDMModalOpen(false)}
      />
    </div>
  );
} 