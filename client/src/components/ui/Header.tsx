import { Button } from './Button';

interface HeaderProps {
  channelName?: string;
  memberCount?: number;
  topic?: string;
}

export function Header({ channelName = 'general', memberCount = 2, topic }: HeaderProps) {
  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
      {/* Left: Channel Name */}
      <div className="flex items-center">
        <h2 className="text-lg font-medium">
          # {channelName}
        </h2>
      </div>

      {/* Middle: Topic */}
      {topic && (
        <div className="flex-1 mx-8">
          <p className="text-sm text-gray-500 truncate max-w-2xl">
            {topic}
          </p>
        </div>
      )}

      {/* Right: Member Count & Actions */}
      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          <span className="text-sm">{memberCount} members</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </Button>
      </div>
    </header>
  );
} 