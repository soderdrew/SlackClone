import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { EmailConfirmation } from '../components/auth/EmailConfirmation';
import { MainLayout } from '../components/layouts/MainLayout';
import { ChannelView } from '../components/channels/ChannelView';

// Temporary Home component for testing
function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome to ChatGenius!</h1>
      <p className="text-gray-600">
        This is where your messages will appear. Select a channel from the sidebar to get started.
      </p>
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

// Public Route Wrapper (accessible only when not authenticated)
function PublicRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  // Public Routes
  {
    element: <PublicRoute />,
    children: [
      {
        path: 'login',
        element: <LoginForm />,
      },
      {
        path: 'register',
        element: <RegisterForm />,
      },
      {
        path: 'confirm-email',
        element: <EmailConfirmation />,
      },
    ],
  },

  // Protected Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <ChannelView />,
      },
      {
        path: '/channels/:channelId',
        element: <ChannelView />,
      },
    ],
  },

  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]); 