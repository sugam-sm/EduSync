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
            className={`flex flex-col items-center justify-center p-2 border-3 border-dashed rounded-2xl transition-all duration-300 group cursor-pointer w-full bg-surface border-light/10 hover:-translate-y-1 hover:shadow-md hover:shadow-primary/50 hover:border-primary sm:min-h-32.5 ${className}`}
        >
            <div className="p-4 rounded-full bg-light/5 group-hover:bg-primary/10 transition-colors">
                <Icon size={32} strokeWidth={2.5} className="text-primary transition-colors" />
            </div>
        </button>
    );
};