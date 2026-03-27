import { useState, useRef, type ChangeEvent, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, ImagePlus, RefreshCw } from "lucide-react";

import { Button } from '../../../components/Buttons/customButton';
import { FormButton } from '../../../components/Buttons/formButton';
import { DecisionPopup } from '../../../components/decision popup';
import { Portal } from '../../../components/Portal';

import { type AppDispatch, type RootState } from '../../../store';
import { 
    type FlashcardDeck, 
    type Flashcard, 
    createFlashcardDeck,
    createFlashcard, 
    updateFlashcard, 
    deleteFlashcard,
    deleteFlashcardDeck
} from '../../../features/learning/flashcardSlice';
import { addToast } from '../../../features/toasts/toastSlice';

interface CardState extends Flashcard {
    frontType: 'TEXT' | 'IMAGE';
    backType: 'TEXT' | 'IMAGE';
    frontImage?: string | null;
    backImage?: string | null;
}

interface ManageFlashcardsProps {
    isOpen: boolean;
    onClose: () => void;
    deck: Partial<FlashcardDeck> & { title: string };
    onBack?: () => void;
    onComplete?: () => void;
    isStepMode?: boolean;
}

export const ManageFlashcards = ({ isOpen, onClose, deck, onBack, onComplete, isStepMode }: ManageFlashcardsProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingFor, setUploadingFor] = useState<{ side: 'front' | 'back' } | null>(null);
    
    // New state to toggle which side the single editor is showing
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

    const currentDeck = useSelector((state: RootState) =>
        state.flashcard.flashcard_decks.find(d => d.id === deck.id)
    ) || (deck as FlashcardDeck);

    const { isCardLoading } = useSelector((state: RootState) => state.flashcard);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const initialCards = (currentDeck.cards || []).map((c: Flashcard) => ({ 
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
        setActiveSide('front');
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
            // 1. Create the deck if it doesn't already exist
            let targetDeckId = deck.id;
            if (!targetDeckId) {
                const deckResponse = await dispatch(createFlashcardDeck({
                    title: deck.title,
                    grade_id: (deck as any).grade_id as any 
                } as any));
                
                if (createFlashcardDeck.fulfilled.match(deckResponse)) {
                    targetDeckId = deckResponse.payload.id;
                } else {
                    throw new Error("Failed to create deck context.");
                }
            }

            const currentCardIds = cards.map(c => c.id).filter(Boolean);
            const cardsToDelete = (currentDeck.cards || []).filter(c => !currentCardIds.includes(c.id));

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
                    deck: targetDeckId,
                    front: c.frontType === 'TEXT' ? c.front : "",
                    back: c.backType === 'TEXT' ? c.back : "",
                    front_image: c.frontType === 'IMAGE' ? c.frontImage : null,
                    back_image: c.backType === 'IMAGE' ? c.backImage : null,
                };
                return dispatch(createFlashcard(payload));
            });

            await Promise.all([...deletePromises, ...updatePromises, ...createPromises]);
            
            dispatch(addToast({ message: "Flashcards saved successfully!", type: 'success' }));
            
            if (isStepMode) {
                onComplete?.();
            } else {
                onClose();
            }
        } catch (error) {
            dispatch(addToast({ message: "Failed to save all cards.", type: 'failure' }));
        }
    };

    const handleClose = (force = false) => {
        if (!force && isDirty) {
            openDecidePopup({
                question: "Discard unsaved changes?",
                confirmText: "Yes, Discard",
                cancelText: "Keep Editing",
                variant: "primary",
                onConfirm: () => handleClose(true)
            });
            return;
        }

        // If the deck is empty (0 cards in DB) and was already created
        if (currentDeck.id && (!currentDeck.cards || currentDeck.cards.length === 0)) {
            dispatch(deleteFlashcardDeck(deck.id!));
            dispatch(addToast({ message: "Empty deck discarded.", type: 'info' }));
        }

        onClose();
    };

    const handleBack = () => {
        if (isDirty) {
            openDecidePopup({
                question: "Discard your changes?",
                confirmText: "Yes, Discard",
                cancelText: "Keep Editing",
                variant: "primary",
                onConfirm: () => onBack?.()
            });
            return;
        }
        onBack?.();
    };

    const handleSaveClick = () => {
        // Validation: Must have at least one card in the UI
        if (cards.length === 0) {
            dispatch(addToast({ message: "You must add at least one card to save the deck.", type: 'info' }));
            return;
        }

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

    const currentCard = cards[selectedIndex];
    const isEditingFront = activeSide === 'front';

    return (
        <Portal>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
            />

            {/* Main Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
                <div className="w-full m-auto md:w-[90%] lg:w-[70%] xl:w-[65%] 2xl:w-[50%] h-[70vh] flex border-light/40 border-2 rounded-2xl overflow-hidden bg-surface">
                    {/* SideBar */}
                    <div className="w-16 flex flex-col gap-2 p-2 max-h-">

                        {/* Deck title */}
                        <span className='[writing-mode:vertical-rl] rotate-180 text-primary flex items-center justify-center text-center font-bold border-2 border-primary bg-primary/10 rounded-xl flex-1'>
                            {deck.title}
                        </span>

                        {/* Deck Cards */}
                        <div className='overflow-y-auto min-h-0 space-y-1.5 border-2 border-primary bg-primary/10 p-1 rounded-xl flex-2'>

                            {/* Actual Cards */}
                            {cards.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`w-full aspect-square shrink-0 rounded-lg border-2 flex items-center justify-center font-bold transition-all ${selectedIndex === idx
                                            ? 'border-primary bg-primary text-light hover:text-light'
                                            : 'border-primary/40 text-text-muted hover:border-primary/70 hover:text-primary'
                                        } hover:cursor-pointer`}
                                >
                                    {idx + 1}
                                </button>
                            ))}

                            <button
                                onClick={addNewCard}
                                className="w-full aspect-square shrink-0 rounded-lg border-2 border-dashed border-light/20 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all hover:cursor-pointer"
                            >
                                <Plus size={20} />
                            </button>
                        </div>                        
                    </div>
                    
                    {/* Flashcard Editor */}
                    <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center p-4 pb-2">

                            {/* Card Number */}
                            <h2 className="text-xl font-bold text-primary">Card {selectedIndex + 1}</h2>

                            {/* Action buttons container */}
                            <div className="flex items-center gap-1">
                                {/* Delete Button */}
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
                                    <Trash2 size={20} strokeWidth={2.5} />
                                </button>
                                
                                {/* Close button */}
                                <button
                                    onClick={() => handleClose()}
                                    className="p-2 hover:bg-failure/20 hover:text-failure rounded-full transition-all duration-300 text-text-muted hover:cursor-pointer hover:rotate-90"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Main Editor */}
                        <div className="flex-1 p-4 flex flex-col gap-1 w-full m-auto overflow-auto">
                            {/* Flashcards editor */}
                            <div className="flex-1 flex flex-col gap-1 w-[90%] sm:w-[45%] h-full m-auto  justify-center overfl">

                                {/* Side Toggle Tabs */}
                                <div className="flex gap-2 p-1 bg-light/5 rounded-xl border-2 border-light/10">
                                    <button 
                                        onClick={() => setActiveSide('front')}
                                        className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${isEditingFront ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                                    >
                                        Front Side
                                    </button>
                                    <button 
                                        onClick={() => setActiveSide('back')}
                                        className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${!isEditingFront ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                                    >
                                        Back Side
                                    </button>
                                </div>

                                {/* Editing */}
                                <div className="w-full aspect-square relative">
                                    {(isEditingFront ? currentCard.frontType : currentCard.backType) === 'TEXT' ? (
                                        <textarea
                                            className="absolute inset-0 w-full h-full text-text-body bg-light/5 border-2 border-light/10 rounded-2xl p-4 focus:border-primary focus:text-primary focus:placeholder:opacity-0 outline-none resize-none transition-all duration-300 placeholder:text-text-muted"
                                            value={isEditingFront ? currentCard.front : currentCard.back}
                                            onChange={(e) => handleUpdateCard(activeSide, e.target.value)}
                                            placeholder={isEditingFront ? "Enter Text" : "Enter Text"}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 w-full h-full bg-light/5 border-2 border-dashed border-light/20 hover:border-primary rounded-2xl flex items-center justify-center text-text-muted hover:text-primary overflow-hidden transition-all cursor-pointer">
                                            {(isEditingFront ? currentCard.frontImage : currentCard.backImage) ? (
                                                <>
                                                    <img src={isEditingFront ? currentCard.frontImage! : currentCard.backImage!} alt="card-side" className="absolute inset-0 w-full h-full object-cover" />
                                                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                        <button onClick={() => { setUploadingFor({ side: activeSide }); fileInputRef.current?.click(); }} className="p-2 bg-surface/80 rounded-full text-primary cursor-pointer"><RefreshCw size={16} /></button>
                                                        <button onClick={() => removeImage(activeSide)} className="p-2 bg-surface/80 rounded-full text-failure cursor-pointer"><Trash2 size={16} /></button>
                                                    </div>
                                                </>
                                            ) : (
                                                <button onClick={() => { setUploadingFor({ side: activeSide }); fileInputRef.current?.click(); }} className="flex flex-col items-center justify-center gap-1 cursor-pointer w-full h-full">
                                                    <ImagePlus size={48} />
                                                    <span>Click to upload image</span>
                                                    <span className='text-[13px]'>Square image suggested</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Content Type Toggle */}
                                <div className="flex gap-2 p-1 bg-light/5 rounded-xl border-2 border-light/10">
                                    <button 
                                        onClick={() => handleUpdateType(activeSide, 'TEXT')} 
                                        className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${(isEditingFront ? currentCard.frontType : currentCard.backType) === 'TEXT' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                                    >
                                        Text
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateType(activeSide, 'IMAGE')} 
                                        className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${(isEditingFront ? currentCard.frontType : currentCard.backType) === 'IMAGE' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                                    >
                                        Image
                                    </button>
                                </div>
                            </div>
                            <div className="w-full flex justify-end">
                                <div className='w-full sm:w-[50%] flex gap-2'>
                                    {isStepMode && onBack ? (
                                        <Button label="Back" onClick={handleBack} variant='failure' className='flex-1' />
                                    ) : (
                                        <Button label="Close" onClick={() => handleClose()} variant='failure' className='flex-1' />
                                    )}
                                    <FormButton 
                                        onClick={handleSaveClick} 
                                        isLoading={isCardLoading} 
                                        variant='primary' 
                                        className='w-full flex-2'
                                    >
                                        Save Deck
                                    </FormButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default ManageFlashcards;