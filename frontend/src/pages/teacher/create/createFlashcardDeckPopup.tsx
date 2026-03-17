import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { createFlashcardDeck, resetFlashcardState } from '../../../features/learning/flashcardSlice';
import { Portal } from '../../../components/Portal';

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
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">New Flashcard Deck</h2>
                                <p className="text-text-muted mt-1 font-medium">Create a new deck for your flashcards</p>
                            </div>
                            <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto md:overflow-y-visible flex-1">
                        <CustomInput 
                            label="Deck Title" 
                            value={deckTitle} 
                            onChange={(e: any) => setDeckTitle(e.target.value)} 
                            placeholder="e.g. Biology - Chapter 1"
                            roleColor="primary"
                        />
                        <p className="text-sm text-text-muted px-1 italic">
                            This deck will be created for the currently selected grade.
                        </p>
                    </div>

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
                            Create Deck
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default CreateFlashcardDeckPopup;