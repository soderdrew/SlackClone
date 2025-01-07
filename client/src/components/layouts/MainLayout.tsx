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
  const { currentChannel } = useAppSelector((state) => state.channels);

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
          topic={currentChannel?.description || ''}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
} 