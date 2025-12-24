import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm";
  
  const variants = {
    primary: "bg-green-500 hover:bg-green-600 text-white shadow-green-200 border-b-4 border-green-700 active:border-b-0 active:translate-y-1",
    secondary: "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200 border-b-4 border-blue-700 active:border-b-0 active:translate-y-1",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-red-200 border-b-4 border-red-700 active:border-b-0 active:translate-y-1",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1",
    outline: "bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};