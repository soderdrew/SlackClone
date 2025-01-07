import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Product Info */}
      <div className="hidden w-1/2 bg-gray-800 text-white p-12 flex-col justify-center lg:flex">
        <h1 className="text-4xl font-bold mb-4">Welcome to Chat Genius</h1>
        <p className="text-xl">
          Experience the power of AI-driven conversations. Chat Genius helps you communicate smarter, faster, and more efficiently than ever before.
        </p>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full p-12 flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-center text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}