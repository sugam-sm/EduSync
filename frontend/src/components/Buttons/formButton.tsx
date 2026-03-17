import React from 'react';
import { Loader } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'failure' | 'info';
}

export const FormButton = ({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '',
  onClick, 
  ...props 
}: ButtonProps) => {
  
  const baseStyles = "font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all duration-100 active:translate-y-0.5 text-base hover:cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-sm";
  
  const variants = {
    primary: "bg-primary/15 text-primary hover:bg-primary/50 hover:text-white border-2 border-primary/20",
    failure: "bg-failure/15 text-failure hover:bg-failure/50 hover:text-white border-2 border-failure/20",
    info: "bg-info/15 text-info hover:bg-info/50 hover:text-white border-2 border-info/20"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader className="animate-spin" size={20} strokeWidth={2.5} />
      ) : (
        children
      )}
    </button>
  );
};