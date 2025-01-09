import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Channel } from '../../types/channel';
import { ChannelMember } from '../../types/channel';
import { channelService } from '../../services/channelService';
import { UserPresence, UserStatus } from '../../types/user';

// Async thunk for fetching channels
export const fetchChannels = createAsyncThunk(
  'channels/fetchChannels',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const [channels, dmChannels] = await Promise.all([
        channelService.getChannels(),
        channelService.getDMChannels()
      ]);
      const allChannels = [...channels, ...dmChannels];
      dispatch(setChannels(allChannels));
      return allChannels;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch channels';
      dispatch(setError(errorMessage));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Async thunk for fetching channel members
export const fetchChannelMembers = createAsyncThunk(
  'channels/fetchMembers',
  async (channelId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setMemberLoading({ channelId, isLoading: true }));
      dispatch(setMemberError({ channelId, error: null }));
      
      const members = await channelService.getChannelMembers(channelId);
      dispatch(setChannelMembers({ channelId, members }));
      
      return members;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch channel members';
      dispatch(setMemberError({ channelId, error: errorMessage }));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setMemberLoading({ channelId, isLoading: false }));
    }
  }
);

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  channelMembers: { [channelId: string]: ChannelMember[] };
  isLoadingMembers: { [channelId: string]: boolean };
  memberErrors: { [channelId: string]: string | null };
  isLoading: boolean;
  error: string | null;
}

const initialState: ChannelState = {
  channels: [],
  currentChannel: null,
  channelMembers: {},
  isLoadingMembers: {},
  memberErrors: {},
  isLoading: false,
  error: null,
};

interface UpdatePresencePayload {
  channelId: string;
  userId: string;
  presence: UserPresence;
}

export const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannels(state, action: PayloadAction<Channel[]>) {
      state.channels = action.payload;
    },
    setCurrentChannel(state, action: PayloadAction<Channel>) {
      state.currentChannel = action.payload;
    },
    addChannel(state, action: PayloadAction<Channel>) {
      state.channels.push(action.payload);
    },
    setChannelMembers(
      state,
      action: PayloadAction<{ channelId: string; members: ChannelMember[] }>
    ) {
      state.channelMembers[action.payload.channelId] = action.payload.members;
    },
    addChannelMember(
      state,
      action: PayloadAction<{ channelId: string; member: ChannelMember }>
    ) {
      const { channelId, member } = action.payload;
      if (!state.channelMembers[channelId]) {
        state.channelMembers[channelId] = [];
      }
      if (!state.channelMembers[channelId].some((m: ChannelMember) => m.id === member.id)) {
        state.channelMembers[channelId].push(member);
      }
    },
    removeChannelMember(
      state,
      action: PayloadAction<{ channelId: string; memberId: string }>
    ) {
      const { channelId, memberId } = action.payload;
      if (state.channelMembers[channelId]) {
        state.channelMembers[channelId] = state.channelMembers[channelId]
          .filter((member: ChannelMember) => member.id !== memberId);
      }
    },
    setMemberLoading(
      state,
      action: PayloadAction<{ channelId: string; isLoading: boolean }>
    ) {
      state.isLoadingMembers[action.payload.channelId] = action.payload.isLoading;
    },
    setMemberError(
      state,
      action: PayloadAction<{ channelId: string; error: string | null }>
    ) {
      state.memberErrors[action.payload.channelId] = action.payload.error;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    updateChannelMemberPresence: (state, action: PayloadAction<UpdatePresencePayload>) => {
      const { channelId, userId, presence } = action.payload;
      
      // Update member in the channelMembers state
      const members = state.channelMembers[channelId];
      if (!members) return;

      const member = members.find(m => 
        m.user_id === userId || (m.user && m.user.id === userId)
      );
      
      if (member && member.user) {
        member.user.presence = presence;
      }
    }
  },
});

export const {
  setChannels,
  setCurrentChannel,
  addChannel,
  setChannelMembers,
  addChannelMember,
  removeChannelMember,
  setMemberLoading,
  setMemberError,
  setLoading,
  setError,
  updateChannelMemberPresence,
} = channelsSlice.actions;

// Selector to get members for a specific channel
export const selectChannelMembers = (state: { channels: ChannelState }, channelId: string): ChannelMember[] => 
  state.channels.channelMembers[channelId] || [];

// Selector to get loading state for members of a specific channel
export const selectChannelMembersLoading = (state: { channels: ChannelState }, channelId: string): boolean => 
  state.channels.isLoadingMembers[channelId] || false;

export default channelsSlice.reducer; 