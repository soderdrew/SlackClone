import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials, setError } from '../../features/auth/authSlice';
import { AuthLayout } from '../layouts/AuthLayout';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../config/api';
import { supabase } from '../../lib/supabase';

export function EmailConfirmation() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();

  useEffect(() => {
    // Handle hash fragment from email confirmation
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.has('access_token') || hashParams.has('error')) {
        // Clear the hash without triggering a reload
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          // Get stored credentials
          const credentialsStr = sessionStorage.getItem('pendingCredentials');
          if (!credentialsStr) return;

          const credentials = JSON.parse(credentialsStr);

          // Attempt to sign in with our backend
          const response = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Auto-login failed');
          }

          // Clear stored credentials
          sessionStorage.removeItem('pendingCredentials');

          // Set auth state
          dispatch(setCredentials({
            user: data.user,
            token: data.session.access_token,
          }));

          // Navigate to home
          navigate('/');
          toast.success('Email verified and logged in successfully!');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Auto-login failed';
          dispatch(setError(message));
          toast.error(message);
        }
      }
    });

    // Handle initial email confirmation if present
    handleEmailConfirmation();

    return () => {
      subscription.unsubscribe();
      sessionStorage.removeItem('pendingCredentials');
    };
  }, [dispatch, navigate, toast]);

  return (
    <AuthLayout title="Check your inbox">
      <div className="text-center space-y-6">
        {/* Email SVG Icon */}
        <div className="flex justify-center">
          <svg
            className="w-24 h-24 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Confirmation Message */}
        <div className="space-y-4">
          <p className="text-lg text-gray-600">
            We've sent you a confirmation email. Please check your inbox and click the verification link to activate your account.
          </p>
          <p className="text-sm text-gray-500">
            If you don't see the email, check your spam folder.
          </p>
          <p className="text-sm text-blue-500">
            Once you verify your email, you'll be automatically signed in.
          </p>
        </div>

        {/* Manual Sign In Button */}
        <div className="pt-6">
          <p className="text-sm text-gray-500 mb-2">
            Already verified? If auto-login doesn't work:
          </p>
          <Link to="/login">
            <Button variant="outline" fullWidth>
              Sign In Manually
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
} 