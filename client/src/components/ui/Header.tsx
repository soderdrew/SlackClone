import { FC, useEffect, memo, useState } from 'react';
import { Popover } from '@headlessui/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchChannelMembers, selectChannelMembers, selectChannelMembersLoading } from '../../features/channels/channelsSlice';
import { Button } from './Button';
import { ChannelMember } from '../../types/channel';
import { GlobalSearch } from '../search/GlobalSearch';
import { StatusIndicator } from './StatusIndicator';
import { AIIcon } from '../icons/AIIcon';
import { AIModal } from '../ai/AIModal';

interface HeaderProps {
  channelName: string;
  channelId: string;
  topic?: string;
}

const getMemberDisplayName = (member: ChannelMember) => {
  return member.user?.full_name || member.user?.username || member.username || 'Unknown User';
};

const getMemberUsername = (member: ChannelMember) => {
  return member.user?.username || member.username || '';
};

const MemberAvatar = memo(({ member, currentUserId }: { member: ChannelMember; currentUserId?: string }) => {
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
        <StatusIndicator status={status} size="md" isCurrentUser={member.user?.id === currentUserId} />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.member.user?.id === nextProps.member.user?.id &&
    prevProps.member.user?.avatar_url === nextProps.member.user?.avatar_url &&
    prevProps.member.user?.presence?.status === nextProps.member.user?.presence?.status
  );
});

MemberAvatar.displayName = 'MemberAvatar';

const MembersList = memo(({ members }: { members: ChannelMember[] }) => {
  const currentUser = useAppSelector(state => state.auth.user);

  return (
    <div className="space-y-1">
      {members?.map((member) => (
        <div
          key={member.id || member.user_id}
          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md"
        >
          <MemberAvatar member={member} currentUserId={currentUser?.id} />
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
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.members.length === nextProps.members.length &&
    prevProps.members.every((prevMember, index) => {
      const nextMember = nextProps.members[index];
      return prevMember.id === nextMember.id &&
        prevMember.user?.presence?.status === nextMember.user?.presence?.status &&
        prevMember.user?.presence?.status_message === nextMember.user?.presence?.status_message;
    });
});

MembersList.displayName = 'MembersList';

const Header: FC<HeaderProps> = ({ channelName, channelId, topic }) => {
  const dispatch = useAppDispatch();
  const members = useAppSelector(state => selectChannelMembers(state, channelId));
  const isLoadingMembers = useAppSelector(state => selectChannelMembersLoading(state, channelId));
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    if (channelId) {
      dispatch(fetchChannelMembers(channelId));
    }
  }, [channelId, dispatch]);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-lg font-medium">{channelName}</h2>
          {topic && <p className="text-sm text-gray-500">{topic}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <GlobalSearch />
        
        <Button 
          variant="ghost" 
          className="p-2"
          onClick={() => setIsAIModalOpen(true)}
        >
          <AIIcon className="h-5 w-5" />
        </Button>
        
        <Popover className="relative">
          <Popover.Button as={Button} variant="ghost">
            <UsersIcon className="h-5 w-5" />
            <span className="ml-2">{members?.length || 0}</span>
          </Popover.Button>

          <Popover.Panel className="absolute right-0 z-10 mt-2 w-72 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Channel Members</h3>
              {isLoadingMembers ? (
                <p className="text-sm text-gray-500">Loading members...</p>
              ) : (
                <MembersList members={members} />
              )}
            </div>
          </Popover.Panel>
        </Popover>

        <AIModal 
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          channelId={channelId}
        />
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export const MemoizedHeader = memo(Header);
export { MemoizedHeader as Header }; 