import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { setError, setLoading } from '../../features/channels/channelsSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useToast } from '../../hooks/useToast';
import { CreateChannelData } from '../../types/channel';
import { channelService } from '../../services/channelService';
import { cn } from '../../utils/cn';
import { LockClosedIcon, HashtagIcon } from '@heroicons/react/24/outline';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState<CreateChannelData>({
    name: '',
    description: '',
    type: 'public',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        type: 'public',
      });
      setFormErrors({
        name: '',
        description: '',
      });
    }
  }, [isOpen]);

  // Validate channel name as user types
  const validateChannelName = (name: string): string => {
    if (!name) return 'Channel name is required';
    if (name.length < 2) return 'Channel name must be at least 2 characters';
    if (name.length > 80) return 'Channel name must be less than 80 characters';
    if (!/^[a-z0-9-]+$/.test(name)) {
      return 'Channel name can only contain lowercase letters, numbers, and hyphens';
    }
    if (name.startsWith('-') || name.endsWith('-')) {
      return 'Channel name cannot start or end with a hyphen';
    }
    if (name.includes('--')) {
      return 'Channel name cannot contain consecutive hyphens';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate channel name on change
    if (name === 'name') {
      setFormErrors(prev => ({
        ...prev,
        name: validateChannelName(value)
      }));
    }
  };

  // Compute if form is valid
  const isValid = useMemo(() => {
    return formData.name.length > 0 && !formErrors.name;
  }, [formData.name, formErrors.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check validation before submitting
    const nameError = validateChannelName(formData.name);
    if (nameError) {
      setFormErrors(prev => ({ ...prev, name: nameError }));
      return;
    }

    try {
      dispatch(setLoading(true));
      
      // Create the channel and get the response
      const channel = await channelService.createChannel(formData);
      
      // Close the modal first
      onClose();
      
      // Then navigate to the new channel
      navigate(`/channels/${channel.id}`);
      
      toast.success('Channel created successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create channel';
      dispatch(setError(message));
      toast.error(message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-50">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Create a channel</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-700">Channel name</Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. project-launch"
                  value={formData.name}
                  onChange={handleChange}
                  error={formErrors.name}
                  className="bg-white text-gray-900"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-700">Description</Label>
              <div className="mt-1">
                <Input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="What's this channel about?"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Privacy</Label>
              <div className="mt-2">
                <div className="w-full px-4 py-3 flex items-center justify-between rounded border border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    {formData.type === 'public' ? (
                      <HashtagIcon className="h-5 w-5 text-gray-600" />
                    ) : (
                      <LockClosedIcon className="h-5 w-5 text-gray-600" />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">
                        {formData.type === 'public' 
                          ? 'Anyone in the workspace can join'
                          : 'Only invited people can join'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      type: prev.type === 'public' ? 'private' : 'public' 
                    }))}
                    className="relative inline-flex w-12 h-7 rounded-full bg-gray-200"
                  >
                    <span
                      className={cn(
                        "absolute left-0.5 top-0.5 inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out",
                        formData.type === 'public' ? 'translate-x-5 bg-blue-600' : 'translate-x-0 bg-gray-400'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-gray-700 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!isValid}
                className={cn(
                  "text-white",
                  isValid 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-blue-400 cursor-not-allowed"
                )}
              >
                Create Channel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 