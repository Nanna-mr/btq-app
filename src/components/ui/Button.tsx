import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

const variants = {
  primary: 'border border-[#245855] bg-[#245855] text-white hover:border-[#1b4542] hover:bg-[#1b4542]',
  secondary: 'border border-[#dedede] bg-white text-[#111111] hover:border-[#989a9a] hover:bg-[#f4f4f4]',
  ghost: 'border border-transparent bg-transparent text-[#111111] hover:bg-[#f4f4f4]',
  danger: 'border border-red-600 bg-red-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md',
};

const sizes = {
  sm: 'min-h-8 px-3 text-sm',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-11 px-5 text-base',
};

export function Button({ variant = 'primary', size = 'md', icon, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-bold transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-[#245855]/15 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
