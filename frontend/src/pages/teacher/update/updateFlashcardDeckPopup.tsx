import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Layers3 } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { updateFlashcardDeck, resetFlashcardState, type FlashcardDeck } from '../../../features/learning/flashcardSlice';
import { Portal } from '../../../components/Portal';

interface UpdateDeckPopupProps {
    isOpen: boolean;
    onClose: () => void;
    deck: FlashcardDeck | null;
}

export const UpdateFlashcardDeckPopup = ({ isOpen, onClose, deck }: UpdateDeckPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, message } = useSelector((state: RootState) => state.flashcard);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const [deckTitle, setDeckTitle] = useState('');

    useEffect(() => {
        if (deck) {
            setDeckTitle(deck.title);
        }
    }, [deck]);

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetFlashcardState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = () => {
        if (deck) setDeckTitle(deck.title);
        onClose();
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!deck || !deck.id) return;

        if (!deckTitle.trim()) {
            dispatch(addToast({ message: "Deck title is required.", type: 'info' }));
            return;
        }

        if (deckTitle === deck.title) {
            dispatch(addToast({ message: "No changes detected.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: `Rename Flashcard deck to "${deckTitle}"?`,
            confirmText: "Yes, Rename",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(updateFlashcardDeck({ 
                    deckId: deck.id!, 
                    deckData: { title: deckTitle } 
                } as any));

                if (updateFlashcardDeck.fulfilled.match(result)) {
                    dispatch(addToast({ message: 'Deck renamed successfully.', type: 'success' }));
                    onClose();
                }
            }
        });
    };

    if (!isOpen || !deck) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-2">
                    <div className="flex justify-between items-center p-3 border-2 border-light/10 bg-surface rounded-3xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                <Layers3 size={24} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-bold text-primary">Rename Deck</h2>
                        </div>
                        <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-180 cursor-pointer">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="rounded-3xl p-5 space-y-5">
                        <CustomInput 
                            label="New Deck Title" 
                            value={deckTitle} 
                            onChange={(e: any) => setDeckTitle(e.target.value)} 
                            placeholder="Enter new deck title"
                            roleColor="primary"
                        />
                    </div>

                    <div className="p-2 border-2 rounded-3xl border-light/10 flex gap-3 bg-light/5">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2'>
                            Save Changes
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default UpdateFlashcardDeckPopup;