import { type LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  Icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'custom' | 'failure';
  className?: string; 
  isTeacher?: boolean;
  title?: string;
}

export const ActionButton = ({
  Icon, 
  onClick, 
  variant = 'custom',
  className = "",
  isTeacher = false,
  title,
}: ActionButtonProps) => {

  const baseStyles = `flex items-center justify-center p-2.5 aspect-square rounded-xl hover:text-white transition-all duration-200 cursor-pointer outline-none active:scale-95 active:translate-y-0.5border-2 border-transparent`;
  
  const variants = {
    'custom': isTeacher 
      ? "bg-info/15 hover:bg-info text-info border-info/10" 
      : "bg-primary/15 hover:bg-primary text-primary border-primary/10",
    'failure': "bg-failure/15 hover:bg-failure text-failure border-failure/10"
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      title={title}
      aria-label={title}
    >
      <Icon size={18} strokeWidth={2.5} />
    </button>
  );
};