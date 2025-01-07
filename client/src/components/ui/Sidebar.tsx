import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { Button } from './Button';
import { CreateChannelModal } from '../channels/CreateChannelModal';
import { channelService } from '../../services/channelService';
import { setChannels } from '../../features/channels/channelsSlice';
import { Channel } from '../../types/channel';

export function Sidebar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { channels } = useAppSelector((state) => state.channels);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const channels = await channelService.getChannels();
        dispatch(setChannels(channels));
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      }
    };
    fetchChannels();
  }, [dispatch]);

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col h-full">
      {/* Workspace Switcher */}
      <div className="h-14 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700">
        <h1 className="text-sm font-medium text-white">ChatGenius</h1>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
            {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-gray-400 truncate">Online</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Browse Section */}
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse
          </Button>
        </div>

        {/* Channels */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Channels
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800 p-1"
              onClick={() => setIsCreateChannelOpen(true)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
          <div className="space-y-1">
            {channels.map((channel: Channel) => (
              <Button 
                key={channel.id}
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
              >
                # {channel.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Direct Messages
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800 p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              John Doe
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
              Jane Smith
            </Button>
          </div>
        </div>
      </nav>

      {/* Create Channel Modal */}
      <CreateChannelModal 
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
      />
    </aside>
  );
} 