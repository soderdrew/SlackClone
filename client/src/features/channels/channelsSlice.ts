import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Channel } from '../../types/channel';
import { ChannelMember } from '../../types/channel';

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  channelMembers: { [channelId: string]: ChannelMember[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: ChannelState = {
  channels: [],
  currentChannel: null,
  channelMembers: {},
  isLoading: false,
  error: null,
};

const channelsSlice = createSlice({
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
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setChannels,
  setCurrentChannel,
  addChannel,
  setChannelMembers,
  setLoading,
  setError,
} = channelsSlice.actions;

export default channelsSlice.reducer; 