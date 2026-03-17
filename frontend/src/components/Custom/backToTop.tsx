import { useState, useEffect, type RefObject } from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopProps {
    scrollRef: RefObject<HTMLDivElement | null>;
    threshold?: number;
}

export const BackToTop = ({ scrollRef, threshold = 300 }: BackToTopProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            setIsVisible(container.scrollTop > threshold);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [scrollRef, threshold]);

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`absolute bottom-6 right-6 p-2 bg-primary text-surface rounded-full shadow-2xl transition-all duration-300 transform z-[60] 
                ${isVisible ? "scale-100 opacity-100 pointer-events-auto" : "scale-0 opacity-0 pointer-events-none"} 
                hover:bg-primary/80 active:scale-95 cursor-pointer border-2 border-white/10`}
            aria-label="Back to top"
        >
            <ArrowUp size={24} strokeWidth={3} />
        </button>
    );
};