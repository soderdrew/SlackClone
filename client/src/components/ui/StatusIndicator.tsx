import React from 'react';
import { UserStatus } from '../../types/user';

interface StatusIndicatorProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  isCurrentUser?: boolean;
}

const statusColors = {
  online: 'bg-teal-400',
  offline: 'bg-gray-400',
  away: 'bg-yellow-400',
  busy: 'bg-red-500',
  invisible: 'bg-gray-400'
};

const statusSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

const statusLabels = {
  online: 'Online',
  offline: 'Offline',
  away: 'Away',
  busy: 'Do not disturb',
  invisible: 'Invisible'
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  size = 'md',
  isCurrentUser = false
}) => {
  // If the user is invisible and it's not the current user viewing their own status,
  // show them as offline
  const displayStatus = (!isCurrentUser && status === 'invisible') ? 'offline' : status;
  const displayLabel = (!isCurrentUser && status === 'invisible') ? 'Offline' : statusLabels[status];

  return (
    <div className="group relative">
      <div
        className={`
          ${statusColors[displayStatus]}
          ${statusSizes[size]}
          rounded-full border-2 border-white shadow-sm
        `}
      />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 
                    hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2
                    whitespace-nowrap z-50">
        {displayLabel}
      </div>
    </div>
  );
}; 