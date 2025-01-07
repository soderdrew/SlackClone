import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setError, setLoading } from '../../features/auth/authSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { AuthLayout } from '../layouts/AuthLayout';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../config/api';

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((state) => state.auth);
  const toast = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    // Full name validation
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
      isValid = false;
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store credentials in sessionStorage (will be cleared when browser is closed)
      sessionStorage.setItem('pendingCredentials', JSON.stringify({
        email: formData.email,
        password: formData.password
      }));

      navigate('/confirm-email');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch(setError(message));
      toast.error(message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <AuthLayout 
      title="Create your account"
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              error={formErrors.full_name}
              required
              disabled={isLoading}
            />
          </div>

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

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Sign up
        </Button>

        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-medium text-blue-600 hover:text-blue-500"
            tabIndex={isLoading ? -1 : 0}
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
} 