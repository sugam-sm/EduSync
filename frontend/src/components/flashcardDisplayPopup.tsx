import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Portal } from './Portal';
import { type FlashcardDeck } from '../features/learning/flashcardSlice';
import { useDispatch } from 'react-redux';
import { addToast } from '../features/toasts/toastSlice';
import { type AppDispatch } from '../store';

const FlashcardFace = ({ card, isFlipped }: any) => {
    return (
        <div className="relative w-full h-full perspective-[1000px]">
            <div
                className="relative w-full h-full transition-transform duration-500"
                style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center text-center text-xl font-medium text-primary bg-surface border-2 border-primary rounded-2xl backface-hidden overflow-hidden">
                    {card.front_image ? (
                        <img src={card.front_image} className="w-full h-full object-cover" />
                    ) : (
                        <p>{card.front}</p>
                    )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-center text-lg font-medium text-primary bg-surface border-2 border-primary rounded-2xl backface-hidden transform-[rotateY(180deg)]">
                    {card.back_image ? (
                        <img src={card.back_image} className="max-h-full object-cover" />
                    ) : (
                        <p>{card.back}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

interface FlashcardDisplayPopupProps {
    isOpen: boolean;
    onClose: () => void;
    deck: FlashcardDeck;
}

export const FlashcardDisplayPopup = ({ isOpen, onClose, deck }: FlashcardDisplayPopupProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
    const toastTriggered = useRef(false);
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        if (isOpen && (!deck.cards || deck.cards.length === 0)) {
            if (!toastTriggered.current) {
                dispatch(addToast({ message: "No Cards to Display", type: "failure" }));
                toastTriggered.current = true;
                onClose();
            }
        } else {
            toastTriggered.current = false;
        }
    }, [isOpen, deck.cards, dispatch, onClose]);

    if (!isOpen || !deck.cards || deck.cards.length === 0) return null;

    const changeCard = (direction: 'next' | 'prev') => {
        if (isAnimating) return;
        
        setIsAnimating(true);
        setOutgoingIndex(currentIndex);
        setIsFlipped(false);

        const nextIndex = direction === 'next' 
            ? (currentIndex + 1) % deck.cards.length 
            : (currentIndex - 1 + deck.cards.length) % deck.cards.length;

        setTimeout(() => {
            setCurrentIndex(nextIndex);
            setOutgoingIndex(null);
            setIsAnimating(false);
        }, 400);
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-50 w-full flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
                <div className="flex flex-col justify-center w-full sm:w-[70%] md:w-[60%] lg:w-[50%] xl:w-[40%] 2xl:w-[40%]rounded-3xl p-6 h-full">
                    <div className='flex items-center justify-between p-3 border-3 border-light/10 rounded-2xl mb-6'>
                        <h2 className="text-lg font-bold text-primary text-center">{deck.title}</h2>
                        <button onClick={onClose} className="p-2 text-text-muted hover:text-failure transition-all hover:rotate-90 duration-300 hover:bg-failure/20 rounded-full cursor-pointer"><X size={24} strokeWidth={2.5}/></button>
                    </div>

                    <div className="relative w-full h-[40%] xl:h-[60%]">
                        
                        {outgoingIndex !== null && (
                            <div className="absolute inset-0 transition-all duration-200 ease-in-out opacity-0 scale-50 z-10">
                                <FlashcardFace card={deck.cards[outgoingIndex]} isFlipped={isFlipped} />
                            </div>
                        )}

                        <div className={`absolute inset-0 transition-all duration-200 ease-out z-20 ${isAnimating ? 'opacity-0 scale-80' : 'opacity-100 scale-100'}`} onClick={() => !isAnimating && setIsFlipped(!isFlipped)}>
                            <FlashcardFace card={deck.cards[currentIndex]} isFlipped={isFlipped} />
                        </div>
                    </div>
                    

                    <div className="text-center mt-6 text-xs text-text-muted italic">Click card to flip</div>

                    <div className="flex justify-between items-center mt-4">
                        <button onClick={() => changeCard('prev')} disabled={isAnimating} className="p-3 bg-light/5 rounded-full  text-primary disabled:opacity-50 animate-bounce cursor-pointer hover:bg-primary/30"><ChevronLeft size={24} /></button>
                        <span className="text-sm font-bold text-text-muted">{currentIndex + 1} / {deck.cards.length}</span>
                        <button onClick={() => changeCard('next')} disabled={isAnimating} className="p-3 bg-light/5 rounded-full  text-primary disabled:opacity-50 animate-bounce cursor-pointer hover:bg-primary/30"><ChevronRight size={24} /></button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};