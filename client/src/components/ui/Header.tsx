import { FC, useEffect, useState } from 'react';
import { Popover } from '@headlessui/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchChannelMembers, selectChannelMembers, selectChannelMembersLoading } from '../../features/channels/channelsSlice';
import { Button } from './Button';
import { ChannelMember } from '../../types/channel';
import { GlobalSearch } from '../search/GlobalSearch';
import { StatusIndicator } from './StatusIndicator';
import { UpdateStatusModal } from './UpdateStatusModal';
import { userService } from '../../services/userService';
import { UserStatus } from '../../types/user';

interface HeaderProps {
  channelName: string;
  channelId: string;
  topic?: string;
}

export const Header: FC<HeaderProps> = ({ channelName, channelId, topic }) => {
  const dispatch = useAppDispatch();
  const members = useAppSelector(state => selectChannelMembers(state, channelId));
  const isLoadingMembers = useAppSelector(state => selectChannelMembersLoading(state, channelId));
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('online');
  const [currentStatusMessage, setCurrentStatusMessage] = useState<string>('');

  useEffect(() => {
    if (channelId) {
      dispatch(fetchChannelMembers(channelId));
    }
  }, [channelId, dispatch]);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      if (currentUser?.id) {
        try {
          const status = await userService.getCurrentUserStatus();
          setCurrentStatus(status.status);
          setCurrentStatusMessage(status.status_message || '');
        } catch (error) {
          console.error('Error fetching current status:', error);
        }
      }
    };
    
    fetchCurrentStatus();
  }, [currentUser?.id]);

  const getMemberDisplayName = (member: ChannelMember) => {
    return member.user?.full_name || member.user?.username || member.username || 'Unknown User';
  };

  const getMemberUsername = (member: ChannelMember) => {
    return member.user?.username || member.username || '';
  };

  const renderMemberAvatar = (member: ChannelMember) => {
    const avatarUrl = member.user?.avatar_url || member.avatar_url;
    const displayName = getMemberDisplayName(member);
    const status = member.user?.presence?.status || 'offline';

    return (
      <div className="relative">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={displayName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
            {displayName[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1">
          <StatusIndicator status={status} size="md" />
        </div>
      </div>
    );
  };

  if (!channelName) return null;

  return (
    <header className="flex-shrink-0 border-b border-gray-200 bg-white h-16">
      <div className="flex items-center h-full px-6">
        <div className="flex-shrink-0 flex items-center">
          <h1 className="text-xl font-semibold text-gray-900 mr-4">#{channelName}</h1>
          <div className="h-6 w-px bg-gray-300 mx-4" />
          <p className="text-sm text-gray-600 truncate max-w-md">
            {topic || 'No description set'}
          </p>
        </div>

        <div className="flex-1" />
        
        <div className="flex items-center space-x-4 ml-4">
          {currentUser && (
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md 
                hover:bg-gray-100 transition-colors duration-150 group
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <StatusIndicator status={currentStatus} size="sm" />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">
                {currentStatusMessage || 'Set a status'}
              </span>
            </button>
          )}

          <GlobalSearch />

          <Popover className="relative flex-shrink-0">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`
                    ${open ? 'bg-gray-50 border-gray-300' : 'border-gray-200'}
                    group flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium
                    bg-white border text-gray-800 hover:border-gray-300 hover:bg-gray-50 
                    transition-colors duration-150 ease-in-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                >
                  <UsersIcon
                    className="h-4 w-4 text-gray-600 group-hover:text-gray-700"
                    aria-hidden="true"
                  />
                  <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                </Popover.Button>

                <Popover.Panel className="absolute right-0 z-10 mt-2 w-screen max-w-xs transform px-2">
                  <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="relative bg-white p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Channel Members</h3>
                        <span className="text-xs text-gray-500">
                          {members.length} {members.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {isLoadingMembers ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="text-sm text-gray-500">Loading members...</div>
                          </div>
                        ) : members.length === 0 ? (
                          <div className="text-sm text-gray-500 py-2">No members found</div>
                        ) : (
                          members.map((member) => (
                            <div
                              key={member.id || member.user_id}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md"
                            >
                              {renderMemberAvatar(member)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {getMemberDisplayName(member)}
                                </p>
                                <div className="flex items-center space-x-2">
                                  {getMemberUsername(member) && (
                                    <p className="text-xs text-gray-500 truncate">@{getMemberUsername(member)}</p>
                                  )}
                                  {member.user?.presence?.status_message && (
                                    <p className="text-xs text-gray-500 truncate">• {member.user.presence.status_message}</p>
                                  )}
                                </div>
                              </div>
                              {member.role === 'admin' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Admin
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </Popover.Panel>
              </>
            )}
          </Popover>
        </div>
      </div>

      {currentUser && (
        <UpdateStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          currentStatus={currentStatus}
          currentStatusMessage={currentStatusMessage}
          userId={currentUser.id}
        />
      )}
    </header>
  );
}; 