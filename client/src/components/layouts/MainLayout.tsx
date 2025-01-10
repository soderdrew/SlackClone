import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../ui/Sidebar';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchChannels } from '../../features/channels/channelsSlice';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentChannel, channels } = useAppSelector((state) => state.channels);

  // Fetch channels on mount
  useEffect(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

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
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
} 