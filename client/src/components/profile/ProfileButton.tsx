import { FC } from 'react';
import { User } from '../../types/user';

interface ProfileButtonProps {
  user: User;
  onClick: () => void;
}

export const ProfileButton: FC<ProfileButtonProps> = ({ user, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-700 rounded-md transition-colors"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-full h-full rounded-full"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
            {user.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      
      {/* User Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-white truncate">
          {user.profile?.full_name || user.username || 'Your Profile'}
        </p>
        <p className="text-xs text-gray-400 truncate">
          View profile
        </p>
      </div>
    </button>
  );
}; 