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
      console.log('REDUCER - setChannelMessages:', {
        channelId: action.payload.channelId,
        messageCount: action.payload.messages.length,
        timestamp: new Date().toISOString()
      });
      
      // Create new messages object to ensure reference change
      state.messages = {
        ...state.messages,
        [action.payload.channelId]: [...action.payload.messages]
      };
      state.error = null;
    },

    // Add a single message to a channel
    addMessage: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      console.log('REDUCER - addMessage:', {
        channelId,
        messageId: action.payload.id,
        timestamp: new Date().toISOString()
      });
      
      // Always create a new array to ensure reference change
      const currentMessages = state.messages[channelId] ? [...state.messages[channelId]] : [];
      const exists = currentMessages.some(msg => msg.id === action.payload.id);
      
      if (!exists) {
        currentMessages.push(action.payload);
        
        // Create new messages object to ensure reference change
        state.messages = {
          ...state.messages,
          [channelId]: currentMessages
        };
        
        console.log('REDUCER - State after update:', {
          channelId,
          messageCount: currentMessages.length,
          timestamp: new Date().toISOString()
        });
      }
      
      state.error = null;
    },

    // Update a message
    updateMessage: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      const currentMessages = state.messages[channelId];
      
      if (currentMessages) {
        const messageIndex = currentMessages.findIndex(
          (msg) => msg.id === action.payload.id
        );
        if (messageIndex !== -1) {
          // Create a new array with the updated message
          const updatedMessages = [
            ...currentMessages.slice(0, messageIndex),
            action.payload,
            ...currentMessages.slice(messageIndex + 1)
          ];
          state.messages = {
            ...state.messages,
            [channelId]: updatedMessages
          };
        }
      }
      state.error = null;
    },

    // Delete a message
    deleteMessage: (
      state,
      action: PayloadAction<{ channelId: string; messageId: string }>
    ) => {
      const { channelId, messageId } = action.payload;
      const currentMessages = state.messages[channelId];
      
      if (currentMessages) {
        // Create a new array without the deleted message
        state.messages = {
          ...state.messages,
          [channelId]: currentMessages.filter((msg) => msg.id !== messageId)
        };
      }
      state.error = null;
    },

    // Clear messages for a channel
    clearChannelMessages: (state, action: PayloadAction<string>) => {
      const newMessages = { ...state.messages };
      delete newMessages[action.payload];
      state.messages = newMessages;
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