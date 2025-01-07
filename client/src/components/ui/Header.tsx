import { FC, useState } from 'react';
import { Button } from './Button';

// First, let's define what a channel member looks like
interface ChannelMember {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'member';
}

interface HeaderProps {
  channelName: string;
  memberCount: number;
  topic?: string;
  members: ChannelMember[];  // Add members to our props
}

export const Header: FC<HeaderProps> = ({ channelName, memberCount, topic, members }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to render member avatar
  const renderMemberAvatar = (member: ChannelMember) => {
    if (member.avatar_url) {
      return (
        <img 
          src={member.avatar_url} 
          alt={member.username}
          className="w-10 h-10 rounded-full"
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
        {member.username[0].toUpperCase()}
      </div>
    );
  };

  if (!channelName) return null;

  return (
    <>
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline space-x-4 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">#{channelName}</h1>
            {topic && (
              <p className="text-base text-gray-600 truncate">{topic}</p>
            )}
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setIsModalOpen(true)}
            className="text-base text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Button>
        </div>
      </header>

      {/* Members Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Channel Members</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {members.length === 0 ? (
                <p className="text-gray-500">No members found</p>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md"
                    >
                      {renderMemberAvatar(member)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.full_name || member.username}
                            </p>
                            {member.full_name && (
                              <p className="text-sm text-gray-500">@{member.username}</p>
                            )}
                          </div>
                          {member.role === 'admin' && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 