import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, FileUp, ListOrdered } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { resetFlashcardState } from '../../../features/learning/flashcardSlice';
import { Portal } from '../../../components/Portal';
import { ResourcePickerPopup } from '../../../components/resourcePickerPopup';
import type { Resource } from '../../../features/learning/resourceSlice';
import api from '../../../api';

interface CreateFlashcardsWithAIPopupProps {
    isOpen: boolean;
    onClose: () => void;
    grade: string | number;
    subject: string | number;
    initialTitle?: string;
    onBack?: () => void;
    onDiscard?: () => void;
}

export const CreateFlashcardsWithAIPopup = ({ isOpen, onClose, grade, subject, initialTitle = '', onBack, onDiscard }: CreateFlashcardsWithAIPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, message } = useSelector((state: RootState) => state.flashcard);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    
    // Form States
    const [title, setTitle] = useState(initialTitle);
    const [prompt, setPrompt] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | Resource | null>(null);
    const [cardCount, setCardCount] = useState<number>(10);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
        }
    }, [isOpen, initialTitle]);

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetFlashcardState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = (force = false) => {
        if (!force) {
            openDecidePopup({
                question: "Discard your changes and quit creation?",
                confirmText: "Yes, Discard",
                cancelText: "Keep Editing",
                variant: "primary",
                onConfirm: () => handleClose(true)
            });
            return;
        }
        
        setTitle('');
        setPrompt('');
        setSelectedFile(null);
        setCardCount(10);
        
        onDiscard?.();
        onClose();
    };

    const handleFileSelect = (file: File | Resource) => {
        setSelectedFile(file);
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            dispatch(addToast({ message: "Deck title is missing.", type: 'info' }));
            return;
        }

        if (!prompt.trim() && !selectedFile) {
            dispatch(addToast({ message: "Please provide a prompt or upload a file for AI generation.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: `Generate AI flashcards for "${title}"?`,
            confirmText: "Yes, Generate",
            cancelText: "Cancel",
            variant: "secondary",
                onConfirm: async () => {
                    setIsGenerating(true);
                    const formData = new FormData();
                    formData.append('title', title);
                    formData.append('grade', String(grade));
                    formData.append('subject', String(subject));
                    formData.append('prompt', prompt);
                    formData.append('card_count', String(cardCount));
                    formData.append('creation_mode', 'ai');
                    
                    if (selectedFile) {
                        if (selectedFile instanceof File) {
                            formData.append('file', selectedFile);
                        } else {
                            formData.append('resource_id', String(selectedFile.id));
                        }
                    }

                    try {
                        const response = await api.post('/api/learning/decks/', formData);
                        if (response.status === 201 || response.status === 202 || response.status === 200) {
                            dispatch(addToast({ 
                                message: 'Flashcard generation started in the background.', 
                                type: 'success' 
                            }));
                            handleClose(true);
                        }
                    } catch (err: any) {
                        dispatch(addToast({ 
                            message: err.response?.data?.error || 'Failed to start AI generation.', 
                            type: 'failure' 
                        }));
                    } finally {
                        setIsGenerating(false);
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
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-primary">AI Flashcard Generator</h2>
                                    <p className="text-text-muted mt-1 font-medium italic">Generating for: <span className="text-primary not-italic font-black">{title}</span></p>
                                </div>
                            </div>
                            <button type="button" onClick={() => handleClose()} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3}/>
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto flex-1 thin-scrollbar">
                        <div className="space-y-1">
                            <label className="text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1">
                                Generation Prompt / Topic Context
                            </label>
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want the flashcards to cover, or paste the text content here..."
                                className="w-full h-40 bg-light/5 border-2 border-light/10 rounded-xl p-3 outline-none text-text-muted font-semibold placeholder-text-muted/50 focus:border-primary focus:text-primary transition-all duration-300 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1">Source Material</label>
                                <button 
                                    type="button"
                                    onClick={() => setIsPickerOpen(true)}
                                    className={`w-full h-13 flex items-center gap-3 px-4 rounded-xl border-2 transition-all ${
                                        selectedFile 
                                        ? "bg-primary/5 border-primary/40 text-primary" 
                                        : "bg-light/5 border-light/10 text-text-muted hover:border-primary/30"
                                    }`}
                                >
                                    <FileUp size={20} className={selectedFile ? "text-primary" : "text-text-muted"} />
                                    <span className="flex-1 text-left font-bold text-sm truncate">
                                        {selectedFile 
                                            ? (selectedFile instanceof File ? selectedFile.name : selectedFile.title) 
                                            : "Choose Files / Resources"
                                        }
                                    </span>
                                </button>
                            </div>
                            <CustomInput 
                                label="Number of Cards"
                                type="number"
                                icon={ListOrdered}
                                value={cardCount}
                                onChange={(e: any) => setCardCount(Number(e.target.value))}
                                roleColor="primary"
                            />
                        </div>

                        <div className="flex flex-col justify-end bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <p className="text-sm font-semibold text-text-muted italic px-1 mb-2">
                                AI will analyze your provided title and content to generate accurate study materials.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Back" onClick={onBack || (() => handleClose())} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading || isGenerating} variant='primary' className='flex-2 py-3'>
                            Generate Flashcards
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
                <ResourcePickerPopup 
                    isOpen={isPickerOpen}
                    onClose={() => setIsPickerOpen(false)}
                    gradeId={grade}
                    onFileSelect={handleFileSelect}
                />
            </div>
        </Portal>
    );
};

export default CreateFlashcardsWithAIPopup;
