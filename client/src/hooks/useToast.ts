import { toast } from 'sonner';

interface ToastOptions {
  duration?: number;
}

export function useToast() {
  const showToast = {
    success: (message: string, options?: ToastOptions) => {
      toast.success(message, {
        duration: options?.duration || 3000,
      });
    },
    error: (message: string, options?: ToastOptions) => {
      toast.error(message, {
        duration: options?.duration || 4000,
      });
    },
    info: (message: string, options?: ToastOptions) => {
      toast(message, {
        duration: options?.duration || 3000,
      });
    },
  };

  return showToast;
} 