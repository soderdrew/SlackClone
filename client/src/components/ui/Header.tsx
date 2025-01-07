import { FC, useState, useEffect } from 'react';
import { Popover } from '@headlessui/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchChannelMembers, selectChannelMembers, selectChannelMembersLoading } from '../../features/channels/channelsSlice';
import { Button } from './Button';

interface ChannelMember {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'member';
}

interface HeaderProps {
  channelName: string;
  channelId: string;
  topic?: string;
}

export const Header: FC<HeaderProps> = ({ channelName, channelId, topic }) => {
  const dispatch = useAppDispatch();
  const members = useAppSelector(state => selectChannelMembers(state, channelId));
  const isLoadingMembers = useAppSelector(state => selectChannelMembersLoading(state, channelId));

  useEffect(() => {
    if (channelId) {
      console.log('Fetching members for channel:', channelId);
      dispatch(fetchChannelMembers(channelId))
        .unwrap()
        .then((result) => {
          console.log('Successfully fetched members:', result);
        })
        .catch((error) => {
          console.error('Failed to fetch members:', error);
        });
    }
  }, [channelId, dispatch]);

  const renderMemberAvatar = (member: ChannelMember) => {
    if (member.avatar_url) {
      return (
        <img 
          src={member.avatar_url} 
          alt={member.username}
          className="w-8 h-8 rounded-full"
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
        {member.username[0].toUpperCase()}
      </div>
    );
  };

  if (!channelName) return null;

  return (
    <header className="flex-shrink-0 border-b border-gray-200 bg-white h-16">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-gray-900 whitespace-nowrap">#{channelName}</h1>
          {topic && (
            <div className="h-6 w-px bg-gray-300 mx-2" />
          )}
          {topic && (
            <p className="text-sm text-gray-600 truncate">{topic}</p>
          )}
        </div>
        
        <div className="flex items-center">
          <Popover className="relative">
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
                              key={member.id}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md"
                            >
                              {renderMemberAvatar(member)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {member.full_name || member.username}
                                </p>
                                {member.full_name && (
                                  <p className="text-xs text-gray-500 truncate">@{member.username}</p>
                                )}
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
    </header>
  );
}; 