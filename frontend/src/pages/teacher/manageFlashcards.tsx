import { useState, useRef, type ChangeEvent, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, ImagePlus, RefreshCw } from "lucide-react";

import { Button } from '../../components/Buttons/customButton';
import { FormButton } from '../../components/Buttons/formButton';
import { DecisionPopup } from '../../components/decision popup';
import { Portal } from '../../components/Portal';

import { type AppDispatch, type RootState } from '../../store';
import { 
    type FlashcardDeck, 
    type Flashcard, 
    createFlashcard, 
    updateFlashcard, 
    deleteFlashcard 
} from '../../features/learning/flashcardSlice';
import { addToast } from '../../features/toasts/toastSlice';

interface CardState extends Flashcard {
    frontType: 'TEXT' | 'IMAGE';
    backType: 'TEXT' | 'IMAGE';
    frontImage?: string | null;
    backImage?: string | null;
}

interface ManageFlashcardsProps {
    isOpen: boolean;
    onClose: () => void;
    deck: FlashcardDeck;
}

export const ManageFlashcards = ({ isOpen, onClose, deck }: ManageFlashcardsProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingFor, setUploadingFor] = useState<{ side: 'front' | 'back' } | null>(null);

    const currentDeck = useSelector((state: RootState) =>
        state.flashcard.flashcard_decks.find(d => d.id === deck.id)
    ) || deck;

    const { isCardLoading } = useSelector((state: RootState) => state.flashcard);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const initialCards = currentDeck.cards.map(c => ({ 
        ...c, 
        frontType: (c.front_image ? 'IMAGE' : 'TEXT') as 'TEXT' | 'IMAGE', 
        backType: (c.back_image ? 'IMAGE' : 'TEXT') as 'TEXT' | 'IMAGE', 
        frontImage: c.front_image, 
        backImage: c.back_image 
    }));

    const [cards, setCards] = useState<CardState[]>(initialCards.length > 0
        ? initialCards
        : [{ 
            deck: deck.id || 0, 
            front: '', 
            back: '', 
            frontType: 'TEXT', 
            backType: 'TEXT', 
            frontImage: null, 
            backImage: null 
        }] as CardState[]);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const getComparisonData = (cardList: CardState[]) => cardList.map(c => ({
        id: c.id,
        deck: c.deck,
        front: c.front,
        back: c.back,
        frontType: c.frontType,
        backType: c.backType,
        frontImage: c.frontImage,
        backImage: c.backImage
    }));

    const isDirty = useMemo(() => {
        return JSON.stringify(getComparisonData(cards)) !== JSON.stringify(getComparisonData(initialCards));
    }, [cards, initialCards]);

    const handleUpdateCard = (field: 'front' | 'back', value: string) => {
        const newCards = [...cards];
        newCards[selectedIndex] = { ...newCards[selectedIndex], [field]: value };
        setCards(newCards);
    };

    const handleUpdateType = (side: 'front' | 'back', type: 'TEXT' | 'IMAGE') => {
        const newCards = [...cards];
        const key = side === 'front' ? 'frontType' : 'backType';
        newCards[selectedIndex] = { ...newCards[selectedIndex], [key]: type };
        setCards(newCards);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadingFor) {
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                dispatch(addToast({ 
                    message: "Please upload a valid image (JPEG, PNG, WEBP, or GIF).", 
                    type: 'failure' 
                }));
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const newCards = [...cards];
                const key = uploadingFor.side === 'front' ? 'frontImage' : 'backImage';
                newCards[selectedIndex] = { ...newCards[selectedIndex], [key]: reader.result as string };
                setCards(newCards);
                setUploadingFor(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (side: 'front' | 'back') => {
        const newCards = [...cards];
        const key = side === 'front' ? 'frontImage' : 'backImage';
        newCards[selectedIndex] = { ...newCards[selectedIndex], [key]: null };
        setCards(newCards);
    };

    const addNewCard = () => {
        setCards([...cards, { deck: deck.id || 0, front: '', back: '', frontType: 'TEXT', backType: 'TEXT', frontImage: null, backImage: null }]);
        setSelectedIndex(cards.length);
    };

    const removeCard = () => {
        if (cards.length === 1) {
            dispatch(addToast({ message: "You must have at least one card.", type: 'info' }));
            return;
        }
        const newCards = cards.filter((_, idx) => idx !== selectedIndex);
        setCards(newCards);
        setSelectedIndex(Math.max(0, selectedIndex - 1));
        dispatch(addToast({ message: "Card removed from selection.", type: 'success' }));
    };

    const saveChanges = async () => {
        try {
            const currentCardIds = cards.map(c => c.id).filter(Boolean);
            const cardsToDelete = currentDeck.cards.filter(c => !currentCardIds.includes(c.id));

            const cardsToUpdate = cards.filter(c => c.id !== undefined);
            const cardsToCreate = cards.filter(c => c.id === undefined);

            const deletePromises = cardsToDelete.map(c => dispatch(deleteFlashcard(c.id!)));
            
            const updatePromises = cardsToUpdate.map(c => {
                const payload: Partial<Flashcard> = {
                    front: c.frontType === 'TEXT' ? c.front : "",
                    back: c.backType === 'TEXT' ? c.back : "",
                    front_image: c.frontType === 'IMAGE' ? c.frontImage : null,
                    back_image: c.backType === 'IMAGE' ? c.backImage : null,
                };
                return dispatch(updateFlashcard({ cardId: c.id!, cardData: payload }));
            });

            const createPromises = cardsToCreate.map(c => {
                const payload: Partial<Flashcard> = {
                    deck: deck.id,
                    front: c.frontType === 'TEXT' ? c.front : "",
                    back: c.backType === 'TEXT' ? c.back : "",
                    front_image: c.frontType === 'IMAGE' ? c.frontImage : null,
                    back_image: c.backType === 'IMAGE' ? c.backImage : null,
                };
                return dispatch(createFlashcard(payload));
            });

            await Promise.all([...deletePromises, ...updatePromises, ...createPromises]);
            
            dispatch(addToast({ message: "Flashcards saved successfully!", type: 'success' }));
            onClose();
        } catch (error) {
            dispatch(addToast({ message: "Failed to save all cards.", type: 'failure' }));
        }
    };

    const handleSaveClick = () => {
        if (!isDirty) {
            dispatch(addToast({ message: "No changes detected.", type: "info" }));
            return;
        }

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const frontValid = card.frontType === 'TEXT' ? card.front.trim() !== "" : !!card.frontImage;
            const backValid = card.backType === 'TEXT' ? card.back.trim() !== "" : !!card.backImage;

            if (!frontValid || !backValid) {
                setSelectedIndex(i);
                dispatch(addToast({ 
                    message: `Card ${i + 1} is incomplete. Please provide content for both sides.`, 
                    type: 'info' 
                }));
                return;
            }
        }

        openDecidePopup({
            question: "Save all changes to this deck?",
            confirmText: "Save",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: saveChanges
        });
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
                <div className="w-full m-auto md:w-[70%] h-[80vh] flex">
                    <div className="w-[20%] sm:w-[15%] md:w-[13%] lg:w-[10%] xl:w-[8%] 2xl:w-[7%] flex border-2 border-light/10 rounded-full p-2 flex-col gap-2 overflow-y-auto">
                        {cards.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedIndex(idx)}
                                className={`w-full aspect-square rounded-full border-2 flex items-center justify-center font-bold transition-all ${selectedIndex === idx
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-light/10 text-text-muted hover:border-primary/70'
                                    } hover:cursor-pointer hover:text-primary`}
                            >
                                {idx + 1}
                            </button>
                        ))}

                        <button
                            onClick={addNewCard}
                            className="w-full aspect-square rounded-full border-2 border-dashed border-light/20 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all hover:cursor-pointer"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center p-4 border-b-2 border-light/10">
                            <h2 className="text-xl font-bold text-primary">Edit Card {selectedIndex + 1}</h2>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() =>
                                        openDecidePopup({
                                            question: "Delete this card?",
                                            confirmText: "Yes, Delete",
                                            cancelText: "Cancel",
                                            variant: "primary",
                                            onConfirm: removeCard
                                        })
                                    }
                                    className="p-2 hover:bg-failure/10 hover:cursor-pointer text-text-muted hover:text-failure rounded-full transition-all"
                                >
                                    <Trash2 size={23} strokeWidth={2.5} />
                                </button>

                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-failure/10 hover:text-failure rounded-full transition-all duration-300 text-text-muted hover:cursor-pointer hover:rotate-270"
                                >
                                    <X size={25} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-6 flex gap-6 flex-col lg:flex-row">
                            <div className="flex-1 flex flex-col gap-2 min-h-0">
                                <label className="text-[11px] font-bold ml-4 text-text-muted uppercase tracking-widest">Front Card</label>
                                {cards[selectedIndex].frontType === 'TEXT' ? (
                                    <textarea
                                        className="flex-1 w-full text-text-body bg-light/5 border-2 border-light/10 rounded-2xl p-4 focus:border-primary focus:text-primary focus:placeholder:opacity-0 outline-none resize-none transition-all duration-300 placeholder:text-text-muted"
                                        value={cards[selectedIndex].front}
                                        onChange={(e) => handleUpdateCard('front', e.target.value)}
                                        placeholder="Enter question..."
                                    />
                                ) : (
                                    <div className="relative flex-1 w-full bg-light/5 border-2 border-dashed border-light/20 hover:border-primary rounded-2xl flex items-center justify-center text-text-muted hover:text-primary overflow-hidden transition-all">
                                        {cards[selectedIndex].frontImage ? (
                                            <>
                                                <img src={cards[selectedIndex].frontImage} alt="front" className="absolute inset-0 w-full h-full object-contain" />
                                                <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                    <button onClick={() => { setUploadingFor({ side: 'front' }); fileInputRef.current?.click(); }} className="p-2 bg-surface/80 rounded-full text-primary cursor-pointer"><RefreshCw size={16} /></button>
                                                    <button onClick={() => removeImage('front')} className="p-2 bg-surface/80 rounded-full text-failure cursor-pointer"><Trash2 size={16} /></button>
                                                </div>
                                            </>
                                        ) : (
                                            <button onClick={() => { setUploadingFor({ side: 'front' }); fileInputRef.current?.click(); }} className="flex flex-col items-center gap-2 cursor-pointer">
                                                <ImagePlus size={48} />
                                                <span>Upload Image</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="flex gap-2 p-1 bg-light/5 rounded-xl border-2 border-light/10">
                                    <button onClick={() => handleUpdateType('front', 'TEXT')} className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${cards[selectedIndex].frontType === 'TEXT' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Text</button>
                                    <button onClick={() => handleUpdateType('front', 'IMAGE')} className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${cards[selectedIndex].frontType === 'IMAGE' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Image</button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-2 min-h-0">
                                <label className="text-[11px] font-bold ml-4 text-text-muted uppercase tracking-widest">Back Card</label>
                                {cards[selectedIndex].backType === 'TEXT' ? (
                                    <textarea
                                        className="flex-1 w-full text-text-body bg-light/5 border-2 border-light/10 rounded-2xl p-4 focus:border-primary focus:text-primary focus:placeholder:opacity-0 outline-none resize-none transition-all duration-300 placeholder:text-text-body"
                                        value={cards[selectedIndex].back}
                                        onChange={(e) => handleUpdateCard('back', e.target.value)}
                                        placeholder="Enter answer..."
                                    />
                                ) : (
                                    <div className="relative flex-1 w-full bg-light/5 border-2 border-dashed border-light/20 hover:border-primary rounded-2xl flex items-center justify-center text-text-muted hover:text-primary overflow-hidden transition-all">
                                        {cards[selectedIndex].backImage ? (
                                            <>
                                                <img src={cards[selectedIndex].backImage} alt="back" className="absolute inset-0 w-full h-full object-contain" />
                                                <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                    <button onClick={() => { setUploadingFor({ side: 'back' }); fileInputRef.current?.click(); }} className="p-2 bg-surface/80 rounded-full text-primary cursor-pointer"><RefreshCw size={16} /></button>
                                                    <button onClick={() => removeImage('back')} className="p-2 bg-surface/80 rounded-full text-failure cursor-pointer"><Trash2 size={16} /></button>
                                                </div>
                                            </>
                                        ) : (
                                            <button onClick={() => { setUploadingFor({ side: 'back' }); fileInputRef.current?.click(); }} className="flex flex-col items-center gap-2 cursor-pointer">
                                                <ImagePlus size={48} />
                                                <span>Upload Image</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="flex gap-2 p-1 bg-light/5 rounded-xl border-2 border-light/10">
                                    <button onClick={() => handleUpdateType('back', 'TEXT')} className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${cards[selectedIndex].backType === 'TEXT' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Text</button>
                                    <button onClick={() => handleUpdateType('back', 'IMAGE')} className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${cards[selectedIndex].backType === 'IMAGE' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Image</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t-2 border-light/10 flex justify-end gap-3">
                            <Button label="Cancel" onClick={onClose} variant='failure' className='w-full' />
                            <FormButton 
                                onClick={handleSaveClick} 
                                isLoading={isCardLoading} 
                                variant='primary' 
                                className='w-full'
                            >
                                Save Deck
                            </FormButton>
                        </div>
                    </div>
                </div>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default ManageFlashcards;