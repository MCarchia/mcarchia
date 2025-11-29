import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'border-sky-500', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${color} border-t-transparent ${className}`}
      role="status"
      aria-label="Caricamento in corso"
    >
      <span className="sr-only">Caricamento...</span>
    </div>
  );
};
