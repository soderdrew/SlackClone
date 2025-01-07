import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, MessagesState } from '../../types/message';

const initialState: MessagesState = {
  messages: {},
  isLoading: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Set all messages for a channel
    setChannelMessages: (
      state,
      action: PayloadAction<{ channelId: string; messages: Message[] }>
    ) => {
      state.messages[action.payload.channelId] = action.payload.messages;
      state.error = null;
    },

    // Add a single message to a channel
    addMessage: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      state.messages[channelId].push(action.payload);
      state.error = null;
    },

    // Update a message
    updateMessage: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      const messageIndex = state.messages[channelId]?.findIndex(
        (msg) => msg.id === action.payload.id
      );
      if (messageIndex !== undefined && messageIndex !== -1) {
        state.messages[channelId][messageIndex] = action.payload;
      }
      state.error = null;
    },

    // Delete a message
    deleteMessage: (
      state,
      action: PayloadAction<{ channelId: string; messageId: string }>
    ) => {
      const { channelId, messageId } = action.payload;
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(
          (msg) => msg.id !== messageId
        );
      }
      state.error = null;
    },

    // Clear messages for a channel
    clearChannelMessages: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setChannelMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  clearChannelMessages,
  setLoading,
  setError,
} = messagesSlice.actions;

export default messagesSlice.reducer; 