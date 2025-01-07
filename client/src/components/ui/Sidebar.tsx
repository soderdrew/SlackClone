import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { Button } from './Button';
import { channelService } from '../../services/channelService';
import { setChannels, setLoading, setError } from '../../features/channels/channelsSlice';
import { CreateChannelModal } from '../channels/CreateChannelModal';
import { Channel } from '../../types/channel';

export function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { channels = [], isLoading } = useAppSelector((state) => state.channels);
  const { user } = useAppSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    async function fetchChannels() {
      console.log('Starting to fetch channels...'); // Debug log
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        console.log('Making API request to get channels...'); // Debug log
        const fetchedChannels = await channelService.getChannels();
        console.log('Raw API response:', fetchedChannels); // Debug log
        
        if (!fetchedChannels || !Array.isArray(fetchedChannels)) {
          console.error('Fetched channels is not an array:', fetchedChannels);
          dispatch(setChannels([]));
          return;
        }
        
        console.log('Number of channels fetched:', fetchedChannels.length); // Debug log
        console.log('Channel details:', fetchedChannels); // Debug log
        dispatch(setChannels(fetchedChannels));
        
        console.log('Current channels in state:', channels); // Debug log
      } catch (error) {
        console.error('Failed to fetch channels:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
        dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch channels'));
        dispatch(setChannels([]));
      } finally {
        dispatch(setLoading(false));
      }
    }

    fetchChannels();
  }, [dispatch]);

  const renderChannelList = () => {
    console.log('Rendering channel list with channels:', channels); // Debug log
    
    if (!Array.isArray(channels)) {
      console.error('Channels is not an array:', channels);
      return null;
    }

    if (channels.length === 0) {
      console.log('No channels to display'); // Debug log
      return (
        <div className="text-gray-400 text-sm px-4">No channels available</div>
      );
    }

    return (
      <ul className="space-y-1">
        {channels.map((channel: Channel) => {
          console.log('Rendering channel:', channel); // Debug log
          return (
            <li key={channel.id}>
              <Link
                to={`/channels/${channel.id}`}
                className="flex items-center px-4 py-1 text-gray-300 hover:bg-gray-800 rounded-md"
              >
                # {channel.name}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="w-60 bg-gray-900 flex-shrink-0 h-full flex flex-col">
      {/* Workspace Header */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4">
        <h1 className="text-white font-semibold text-lg">ChatGenius</h1>
      </div>

      {/* User Info */}
      <div className="px-4 py-2 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-white text-sm">{user?.email?.[0].toUpperCase()}</span>
          </div>
          <span className="text-white text-sm">{user?.email}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Channels Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-gray-400 text-sm font-medium">Channels</h2>
            <Button onClick={() => setIsCreateModalOpen(true)} variant="ghost" size="sm">
              +
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-gray-400 text-sm px-4">Loading channels...</div>
          ) : (
            renderChannelList()
          )}
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="px-4 mb-2 flex justify-between items-center group">
            <h2 className="text-gray-400 uppercase text-xs font-semibold tracking-wider">Direct Messages</h2>
            <button
              onClick={() => console.log('Add DM clicked')}
              className="text-gray-400 hover:bg-gray-800 p-1 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            <Link
              to="/dm/john-doe"
              className="flex items-center px-4 py-1 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              John Doe
            </Link>
            <Link
              to="/dm/jane-smith"
              className="flex items-center px-4 py-1 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
              Jane Smith
            </Link>
          </div>
        </div>
      </nav>

      {/* Create Channel Modal */}
      {isCreateModalOpen && (
        <CreateChannelModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
} 