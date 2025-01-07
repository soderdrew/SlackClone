import { LabelHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-gray-700 mb-1",
        className
      )}
      {...props}
    />
  );
} 