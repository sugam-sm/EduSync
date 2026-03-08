import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface CustomButtonProps {
  label?: string;
  Icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'failure';
  className?: string; 
  children?: ReactNode;
}

export const Button = ({ 
  label, 
  Icon, 
  onClick, 
  variant = 'primary',
  className="",
  children
}: CustomButtonProps) => {
  
  const baseStyles = `flex gap-1 rounded-2xl justify-center items-center font-semibold px-3 py-2 cursor-pointer active:translate-y-0.5 transition-all duration-100 hover:shadow-backdrop-blur-2xl hover:shadow-sm`;
  
  const variants = {
    'primary': "bg-primary/80 text-white  hover:shadow-primary hover:bg-primary/100",
    'failure': "bg-failure/60 text-white  hover:shadow-failure hover:bg-failure/100"
  } 

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} strokeWidth={3} />}
      {label && <span>{label}</span>}
      {children}
    </button>
  );
};