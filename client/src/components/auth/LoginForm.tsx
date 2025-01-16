import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setCredentials, setError, setLoading, setProfile } from '../../features/auth/authSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { AuthLayout } from '../layouts/AuthLayout';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { userService } from '../../services/userService';

export function LoginForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((state) => state.auth);
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    let isValid = true;
    const errors = { email: '', password: '' };

    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      dispatch(setLoading(true));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Get stored credentials for full name if they exist (from signup flow)
      const storedCredentials = sessionStorage.getItem('pendingCredentials');
      const parsedCredentials = storedCredentials ? JSON.parse(storedCredentials) : null;

      // Create profile if it doesn't exist (for first-time logins)
      await userService.createProfileIfNotExists(
        data.user.id,
        data.user.email!,
        parsedCredentials?.full_name || data.user.user_metadata?.full_name
      );

      // Fetch the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // Clear stored credentials after successful profile creation
      sessionStorage.removeItem('pendingCredentials');

      dispatch(setCredentials({
        user: data.user,
        token: data.session.access_token,
      }));

      // Set the profile in the Redux store
      if (profile) {
        dispatch(setProfile(profile));
      }
      
      toast.success('Successfully logged in!');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch(setError(message));
      toast.error(message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <AuthLayout 
      title="Sign in to your account"
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Sign in
        </Button>

        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="font-medium text-blue-600 hover:text-blue-500"
            tabIndex={isLoading ? -1 : 0}
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
} 