import { configureStore } from '@reduxjs/toolkit';
import messagesReducer from '../features/messages/messagesSlice';
import channelsReducer from '../features/channels/channelsSlice';
import authReducer from '../features/auth/authSlice';

// Create store with enhanced middleware
export const store = configureStore({
  reducer: {
    messages: messagesReducer,
    channels: channelsReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check for Supabase realtime data
      immutableCheck: {
        ignoredPaths: ['messages.messages'], // Ignore immutability checks for messages
      },
    }),
  devTools: {
    name: 'ChatGenius',
    trace: true,
    traceLimit: 25,
  },
});

// Enhanced debugging in development
if (process.env.NODE_ENV === 'development') {
  store.subscribe(() => {
    const state = store.getState();
    const timestamp = new Date().toISOString();
    
    // Log message counts by channel
    const messageCounts = Object.entries(state.messages.messages).map(([channelId, messages]) => ({
      channelId,
      count: messages?.length || 0,
    }));

    console.log('REDUX - State Updated:', {
      timestamp,
      currentChannel: state.channels.currentChannel?.id,
      messageCounts,
    });
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 