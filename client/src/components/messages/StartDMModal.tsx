import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { userService } from '../../services/userService';
import { channelService } from '../../services/channelService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { setChannels } from '../../features/channels/channelsSlice';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

interface StartDMModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StartDMModal({ isOpen, onClose }: StartDMModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { channels } = useAppSelector((state) => state.channels);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const fetchedUsers = await userService.getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateDM = async (selectedUser: User) => {
    try {
      setIsLoading(true);
      const channel = await channelService.createDirectMessageChannel(selectedUser.id);
      
      // Add the new channel to the Redux store by updating the channels array
      dispatch(setChannels([...channels, channel]));
      
      // Navigate to the new DM channel
      navigate(`/channels/${channel.id}`);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Failed to create DM:', error);
      toast.error('Failed to create DM. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Start a Conversation</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            ×
          </button>
        </div>

        <Input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {searchQuery ? 'No users found' : 'No users available'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateDM(user)}
                  className="w-full flex items-center space-x-3 p-2 bg-white border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {(user.username[0] || '').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">
                      {user.full_name || user.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="mr-2"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
} 