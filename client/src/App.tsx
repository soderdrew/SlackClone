import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store/store';
import { router } from './routes';
import { Toaster } from 'sonner';

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </Provider>
  );
}

export default App;
