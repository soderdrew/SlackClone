import { ReactNode } from 'react';
import { Sidebar } from '../ui/Sidebar';
import { Header } from '../ui/Header';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <Header 
          channelName="general"
          memberCount={2}
          topic="Welcome to the general channel! 👋"
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
} 