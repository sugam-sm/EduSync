import { type LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  Icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'custom' | 'failure';
  className?: string; 
  isTeacher?: boolean;
  title?: string;
  disabled?: boolean;
}

export const ActionButton = ({
  Icon, 
  onClick, 
  variant = 'custom',
  className = "",
  isTeacher = false,
  title,
  disabled = false,
}: ActionButtonProps) => {

  const baseStyles = `flex items-center justify-center p-2.5 aspect-square rounded-xl transition-all duration-200 outline-none border-2 border-transparent ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:text-white active:scale-95 active:translate-y-0.5'}`;
  
  const variants = {
    'custom': isTeacher 
      ? `bg-info/15 ${!disabled ? 'hover:bg-info' : ''} text-info border-info/10` 
      : `bg-primary/15 ${!disabled ? 'hover:bg-primary' : ''} text-primary border-primary/10`,
    'failure': `bg-failure/15 ${!disabled ? 'hover:bg-failure' : ''} text-failure border-failure/10`
  };

  return (
    <button
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        onClick(e);
      }}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      title={title}
      aria-label={title}
    >
      <Icon size={18} strokeWidth={2.5} />
    </button>
  );
};