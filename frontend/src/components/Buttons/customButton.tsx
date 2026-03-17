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
  
  const baseStyles = `flex gap-2 rounded-2xl justify-center items-center font-bold px-3 py-3 cursor-pointer transition-all duration-100 outline-none active:translate-y-0.5 border-2 hover:cursor-pointer disabled:opacity-70 hover:shadow-sm`;
  
  const variants = {
    'primary': "bg-primary/15 text-primary hover:bg-primary/50 hover:text-white border-primary/20",
    'failure': "bg-failure/15 text-failure hover:bg-failure/50 hover:text-white border-failure/20"
  } 

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} strokeWidth={2.5} />}
      {label && <span className="text-base">{label}</span>}
      {children}
    </button>
  );
};