import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Channel, ChannelState } from '../../types/channel';

const initialState: ChannelState = {
  channels: [],
  currentChannel: null,
  isLoading: false,
  error: null,
};

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannels: (state, action: PayloadAction<Channel[]>) => {
      state.channels = action.payload;
      state.error = null;
    },
    addChannel: (state, action: PayloadAction<Channel>) => {
      state.channels.push(action.payload);
      state.error = null;
    },
    setCurrentChannel: (state, action: PayloadAction<Channel | null>) => {
      state.currentChannel = action.payload;
      state.error = null;
    },
    updateChannel: (state, action: PayloadAction<Channel>) => {
      const index = state.channels.findIndex(channel => channel.id === action.payload.id);
      if (index !== -1) {
        state.channels[index] = action.payload;
      }
      if (state.currentChannel?.id === action.payload.id) {
        state.currentChannel = action.payload;
      }
      state.error = null;
    },
    deleteChannel: (state, action: PayloadAction<string>) => {
      state.channels = state.channels.filter(channel => channel.id !== action.payload);
      if (state.currentChannel?.id === action.payload) {
        state.currentChannel = null;
      }
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setChannels,
  addChannel,
  setCurrentChannel,
  updateChannel,
  deleteChannel,
  setLoading,
  setError,
} = channelsSlice.actions;

export default channelsSlice.reducer; 