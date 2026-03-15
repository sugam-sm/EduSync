import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Layers3 } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { createFlashcardDeck, resetFlashcardState } from '../../../features/learning/flashcardSlice';

interface CreateDeckPopupProps {
    isOpen: boolean;
    onClose: () => void;
    gradeId: string | number;
}

export const CreateFlashcardDeckPopup = ({ isOpen, onClose, gradeId }: CreateDeckPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, message } = useSelector((state: RootState) => state.flashcard);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const [deckTitle, setDeckTitle] = useState('');

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetFlashcardState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = () => {
        setDeckTitle('');
        onClose();
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!deckTitle.trim()) {
            dispatch(addToast({ message: "Deck title is required.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: `Create flashcard deck "${deckTitle}"?`,
            confirmText: "Yes, Create",
            cancelText: "Cancel",
            variant: "secondary",
            onConfirm: async () => {
                const result = await dispatch(createFlashcardDeck({ 
                    title: deckTitle, 
                    grade_id: gradeId as number 
                } as any)); 

                if (createFlashcardDeck.fulfilled.match(result)) {
                    dispatch(addToast({ message: 'Deck created successfully.', type: 'success' }));
                    handleClose();
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 border-2 border-light/10 bg-surface rounded-3xl m-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                            <Layers3 size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-bold text-primary">New Flashcard Deck</h2>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-90 cursor-pointer">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <CustomInput 
                        label="Deck Title" 
                        value={deckTitle} 
                        onChange={(e: any) => setDeckTitle(e.target.value)} 
                        placeholder="e.g. Biology - Chapter 1"
                        roleColor="primary"
                    />
                    <p className="text-[11px] text-text-muted px-1 italic">
                        This deck will be created for the currently selected grade.
                    </p>
                </div>

                <div className="p-2 border-2 rounded-3xl border-light/5 flex gap-3 bg-light/5 m-2">
                    <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1' />
                    <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2'>
                        Create Deck
                    </FormButton>
                </div>
            </form>
            <DecidePopup />
        </div>
    );
};

export default CreateFlashcardDeckPopup;