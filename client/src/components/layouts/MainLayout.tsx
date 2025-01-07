import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../ui/Sidebar';
import { Header } from '../ui/Header';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { channelService } from '../../services/channelService';
import { setChannelMembers } from '../../features/channels/channelsSlice';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentChannel, channels } = useAppSelector((state) => state.channels);

  // Auto-select general channel on initial load
  useEffect(() => {
    if (!currentChannel && channels.length > 0) {
      const generalChannel = channels.find(channel => channel.name === 'general');
      if (generalChannel) {
        navigate(`/channels/${generalChannel.id}`);
      }
    }
  }, [currentChannel, channels, navigate]);

  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <Header 
          channelName={currentChannel?.name || ''}
          channelId={currentChannel?.id || ''}
          topic={currentChannel?.description || 'No description set'}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
} 