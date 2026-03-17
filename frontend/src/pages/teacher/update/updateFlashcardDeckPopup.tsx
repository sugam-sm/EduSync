import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from "lucide-react";
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">Rename Deck</h2>
                                <p className="text-text-muted mt-1 font-medium">Update the title of your flashcard deck</p>
                            </div>
                            <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto md:overflow-y-visible flex-1">
                        <CustomInput 
                            label="New Deck Title" 
                            value={deckTitle} 
                            onChange={(e: any) => setDeckTitle(e.target.value)} 
                            placeholder="Enter new deck title"
                            roleColor="primary"
                        />
                    </div>

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
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