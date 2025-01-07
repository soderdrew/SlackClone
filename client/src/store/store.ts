import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import channelsReducer from '../features/channels/channelsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    channels: channelsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 