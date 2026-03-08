import { type LucideIcon } from 'lucide-react';


interface ActionButtonProps {
  label?: string;
  Icon?: LucideIcon;
  onClick: () => void;
  variant?: 'custom' | 'failure';
  className?: string; 
  isTeacher?: boolean;
}

export const ActionButton = ({
  label, 
  Icon, 
  onClick, 
  variant = 'custom',
  className="",
  isTeacher = false,
}: ActionButtonProps) => {

  const baseStyles = `flex font-bold w-full lg:w-[32.5%] justify-center items-center py-2.5 rounded-xl hover:text-white transition-all duration-100 cursor-pointer text-sm gap-1 outline-none active:translate-y-0.5`;
  
  const variants = {
    'custom': isTeacher ? "bg-info/20 hover:bg-info/70 text-info" : "bg-primary/25 hover:bg-primary/70 text-primary",
    'failure': "bg-failure/20 hover:bg-failure/70 text-failure"
  } 

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={15} strokeWidth={3} />}
      {label && <span>{label}</span>}
    </button>
  );
};