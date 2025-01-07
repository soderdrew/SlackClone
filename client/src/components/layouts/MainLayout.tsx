import { ReactNode, useEffect } from 'react';
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
  const { currentChannel, channelMembers } = useAppSelector((state) => state.channels);

  // Fetch channel members when current channel changes
  useEffect(() => {
    async function fetchChannelMembers() {
      if (!currentChannel?.id) return;
      
      try {
        const members = await channelService.getChannelMembers(currentChannel.id);
        dispatch(setChannelMembers({ channelId: currentChannel.id, members }));
      } catch (error) {
        console.error('Failed to fetch channel members:', error);
      }
    }

    fetchChannelMembers();
  }, [currentChannel?.id, dispatch]);

  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <Header 
          channelName={currentChannel?.name || ''}
          memberCount={currentChannel?.member_count || 0}
          topic={currentChannel?.description || ''}
          members={channelMembers[currentChannel?.id || ''] || []}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
} 