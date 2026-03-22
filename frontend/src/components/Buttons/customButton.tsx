import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface CustomButtonProps {
  label?: string;
  Icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'failure' | 'secondary' | 'success' | 'warning' | 'info';
  className?: string; 
  children?: ReactNode;
  disabled?: boolean;
}

export const Button = ({ 
  label, 
  Icon, 
  onClick, 
  variant = 'primary',
  className="",
  children,
  disabled
}: CustomButtonProps) => {
  
  const baseStyles = `flex gap-2 rounded-2xl justify-center items-center font-bold px-0 py-3 cursor-pointer transition-all duration-100 outline-none active:translate-y-0.5 border-2 hover:cursor-pointer disabled:opacity-70 hover:shadow-sm`;
  
  const variants = {
    'primary': "bg-primary/15 text-primary hover:bg-primary/50 hover:text-white border-primary/20",
    'secondary': "bg-light/10 text-text-body hover:bg-light/20 border-light/10",
    'failure': "bg-failure/15 text-failure hover:bg-failure/50 hover:text-white border-failure/20",
    'success': "bg-success/10 text-success hover:bg-success/50 hover:text-white border-success/20",
    'warning': "bg-warning/10 text-warning hover:bg-warning/50 hover:text-white border-warning/20",
    'info': "bg-info/10 text-info hover:bg-info/50 hover:text-white border-info/20"
  } 

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {Icon && <Icon size={20} strokeWidth={3} />}
      {label && <span className="text-base">{label}</span>}
      {children}
    </button>
  );
};