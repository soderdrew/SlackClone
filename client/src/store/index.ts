import { configureStore } from '@reduxjs/toolkit';
import messagesReducer from '../features/messages/messagesSlice';
import channelsReducer from '../features/channels/channelsSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    messages: messagesReducer,
    channels: channelsReducer,
    auth: authReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 