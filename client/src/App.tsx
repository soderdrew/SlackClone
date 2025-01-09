import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from 'sonner';
import { store } from './store';
import { PresenceHandler } from './components/presence/PresenceHandler';

function App() {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <PresenceHandler />
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </Provider>
    </React.StrictMode>
  );
}

export default App;
