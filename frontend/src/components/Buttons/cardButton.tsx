import { type LucideIcon } from "lucide-react";

interface CustomCardButtonProps {
    onClick: () => void;
    Icon: LucideIcon;
    className?: string;
}

export const CardButton = ({ onClick, Icon, className = "" }: CustomCardButtonProps) => {
    return (
        <button 
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center border-3 border-dashed rounded-xl transition-all duration-300 group cursor-pointer w-full bg-surface border-light/10 hover:-translate-y-1 hover:shadow-md hover:shadow-primary/50 hover:border-primary ${className}`}
        >
            <div className="p-3 lg:p-0 rounded-xl  transition-colors">
                <Icon size={40} strokeWidth={2.5} className="text-text-muted group-hover:text-primary transition-colors" />
            </div>
        </button>
    );
};