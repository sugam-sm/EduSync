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
  
  const baseStyles = "font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-100 active:translate-y-1 text-lg hover:cursor-pointer disabled:opacity-70 disabled:cursor-pointer hover:shadow-sm";
  
  // Variant styles
  const variants = {
    primary: "bg-primary/50 text-text-heading shadow-primary hover:bg-primary/80",
    failure: "bg-failure/50 text-text-heading shadow-failure hover:bg-failure/80",
    info: "bg-info/50 text-text-heading shadow-info hover:bg-info/80"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader className="animate-spin" size={28} strokeWidth={3} />
      ) : (
        children
      )}
    </button>
  );
};