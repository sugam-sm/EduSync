import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { addToast } from '../../../features/toasts/toastSlice';
import { resetFlashcardState } from '../../../features/learning/flashcardSlice';
import { DecisionPopup } from '../../../components/decision popup';
import { Portal } from '../../../components/Portal';
import { ManageFlashcards } from '../manage/manageFlashcards';

interface CreateDeckPopupProps {
    isOpen: boolean;
    onClose: () => void;
    gradeId: string | number;
    onSwitchToAI?: (title: string) => void;
}

export const CreateFlashcardDeckPopup = ({ isOpen, onClose, gradeId, onSwitchToAI }: CreateDeckPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, message } = useSelector((state: RootState) => state.flashcard);

    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const [step, setStep] = useState(1);
    const [deckTitle, setDeckTitle] = useState('');
    const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual');

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetFlashcardState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = (force = false) => {
        if (!force && deckTitle.trim()) {
            openDecidePopup({
                question: "Discard your changes?",
                confirmText: "Yes, Discard",
                cancelText: "Keep Editing",
                variant: "primary",
                onConfirm: () => handleClose(true)
            });
            return;
        }
        setStep(1);
        setDeckTitle('');
        setCreationMode('manual');
        onClose();
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!deckTitle.trim()) {
            dispatch(addToast({ message: "Deck title is required.", type: 'info' }));
            return;
        }

        if (creationMode === 'ai') {
            onSwitchToAI?.(deckTitle);
            return;
        }

        openDecidePopup({
            question: "Are you sure you want to start building cards for this deck?",
            confirmText: "Yes, Continue",
            cancelText: "Cancel",
            variant: "secondary",
            onConfirm: () => setStep(2)
        });
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <form 
                    onSubmit={handleSubmit} 
                    className={`w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh] transition-all duration-500 ${step === 2 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
                >
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary uppercase tracking-tight">New Flashcard Deck</h2>
                                <p className="text-text-muted mt-1 font-medium italic opacity-80">Step 1: Set a Title & Choose Mode</p>
                            </div>
                            <button type="button" onClick={() => handleClose()} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto md:overflow-y-visible flex-1">
                        {/* Creation Mode Toggle */}
                        <div className="flex w-full gap-1 p-1 bg-light/5 rounded-xl border-2 border-light/15">
                            <button
                                type="button"
                                onClick={() => setCreationMode('manual')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${creationMode === 'manual' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                            >
                                Create Manually
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreationMode('ai')}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${creationMode === 'ai' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                            >
                                Build with AI
                            </button>
                        </div>

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
                        <Button label="Cancel" onClick={() => handleClose()} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
                            {creationMode === 'manual' ? 'Build Cards' : 'Generate with AI'}
                        </FormButton>
                    </div>
                </form>

                {step === 2 && (
                    <ManageFlashcards
                        isOpen={true}
                        onClose={() => handleClose(true)}
                        deck={{ title: deckTitle, grade_id: gradeId } as any}
                        isStepMode={true}
                        onBack={() => setStep(1)}
                        onComplete={() => handleClose(true)}
                    />
                )}
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default CreateFlashcardDeckPopup;