import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, FileUp, ListOrdered } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { resetQuizState } from '../../../features/learning/quizSlice';
import { Portal } from '../../../components/Portal';
import { ResourcePickerPopup } from '../../../components/resourcePickerPopup';
import type { Resource } from '../../../features/learning/resourceSlice';
import api from '../../../api';

interface CreateQuizWithAIPopupProps {
    isOpen: boolean;
    onClose: () => void;
    grade: string | number;
    subject: string | number;
    initialTitle?: string;
    initialTime?: number | string;
    initialPoints?: number | string;
    initialStart?: string;
    initialEnd?: string;
    onBack?: () => void;
    onDiscard?: () => void;
}

export const CreateQuizWithAIPopup = ({
    isOpen,
    onClose,
    grade,
    subject,
    initialTitle = '',
    initialTime = 30,
    initialPoints = 1,
    initialStart = '',
    initialEnd = '',
    onBack,
    onDiscard
}: CreateQuizWithAIPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, message } = useSelector((state: RootState) => state.quiz);

    const { openDecidePopup, DecidePopup } = DecisionPopup();

    // Form States
    const [title, setTitle] = useState(initialTitle);
    const [prompt, setPrompt] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | Resource | null>(null);
    const [questionCount, setQuestionCount] = useState<number>(10);
    const [defaultTime, setDefaultTime] = useState<number | string>(initialTime);
    const [defaultPoints, setDefaultPoints] = useState<number | string>(initialPoints);
    const [startTime, setStartTime] = useState(initialStart);
    const [endTime, setEndTime] = useState(initialEnd);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setDefaultTime(initialTime);
            setDefaultPoints(initialPoints);
            setStartTime(initialStart);
            setEndTime(initialEnd);
        }
    }, [isOpen, initialTitle, initialTime, initialPoints, initialStart, initialEnd]);

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetQuizState());
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
        setQuestionCount(10);
        setDefaultTime(30);
        setDefaultPoints(1);
        setStartTime('');
        setEndTime('');

        onDiscard?.();
        onClose();
    };

    const handleFileSelect = (file: File | Resource) => {
        setSelectedFile(file);
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            dispatch(addToast({ message: "Quiz title is missing.", type: 'info' }));
            return;
        }

        if (!startTime) {
            dispatch(addToast({ message: "Start time is missing.", type: 'info' }));
            return;
        }

        if (!endTime) {
            dispatch(addToast({ message: "End time is missing.", type: 'info' }));
            return;
        }

        if (new Date(startTime) >= new Date(endTime)) {
            dispatch(addToast({ message: "End time must be after start time.", type: 'info' }));
            return;
        }

        if (!prompt.trim() && !selectedFile) {
            dispatch(addToast({ message: "Please provide a prompt or upload a file for AI generation.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: `Generate AI Quiz for "${title}"?`,
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
                    formData.append('question_count', String(questionCount));
                    formData.append('default_time_per_question', String(defaultTime));
                    formData.append('default_points_per_question', String(defaultPoints));
                    formData.append('start_datetime', new Date(startTime).toISOString());
                    formData.append('end_datetime', new Date(endTime).toISOString());
                    formData.append('creation_mode', 'ai');

                    if (selectedFile) {
                        if (selectedFile instanceof File) {
                            formData.append('file', selectedFile);
                        } else {
                            formData.append('resource_id', String(selectedFile.id));
                        }
                    }

                    try {
                        const response = await api.post('/api/learning/quizzes/', formData);
                        if (response.status === 201 || response.status === 202 || response.status === 200) {
                            dispatch(addToast({
                                message: 'Quiz generation started in the background. Refresh the page after some time to see the updates.',
                                type: 'success'
                            }));
                            handleClose(true);
                        }
                    } catch (err: any) {
                        dispatch(addToast({
                            message: err.response?.data?.error || 'Failed to start AI generation. try again',
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
                <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-primary">AI Quiz Generator</h2>
                                    <p className="text-text-muted mt-1 font-medium italic">Generating for: <span className="text-primary not-italic font-black">{title}</span></p>
                                </div>
                            </div>
                            <button type="button" onClick={() => handleClose()} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto flex-1 thin-scrollbar">

                        <div className="space-y-1">
                            <label className="text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1">
                                AI Generation Context / Instructions
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the topics, learning objectives, or paste material the AI should use for questions..."
                                className="w-full h-40 bg-light/5 border-2 border-light/10 rounded-xl p-3 outline-none text-text-muted font-semibold placeholder-text-muted/50 focus:border-primary focus:text-primary transition-all duration-300 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1">Source Material</label>
                                <button
                                    type="button"
                                    onClick={() => setIsPickerOpen(true)}
                                    className={`w-full h-13 flex items-center gap-3 px-4 rounded-xl border-2 transition-all ${selectedFile
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
                                label="Questions Number"
                                type="number"
                                icon={ListOrdered}
                                value={questionCount}
                                onChange={(e: any) => setQuestionCount(Number(e.target.value))}
                                roleColor="primary"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomInput
                                label="Timer (sec) per question"
                                type="number"
                                min="30"
                                value={defaultTime}
                                onChange={(e: any) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                        setDefaultTime("");
                                    } else {
                                        const numVal = Number(val);
                                        setDefaultTime(isNaN(numVal) ? 30 : Math.max(0, numVal));
                                    }
                                }}
                                onBlur={() => {
                                    if (defaultTime !== "" && Number(defaultTime) < 30) {
                                        setDefaultTime(30);
                                    }
                                }}
                                roleColor="primary"
                            />
                            <CustomInput
                                label="Points per question"
                                type="number"
                                min="1"
                                value={defaultPoints}
                                onChange={(e: any) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                        setDefaultPoints("");
                                    } else {
                                        const numVal = Number(val);
                                        setDefaultPoints(isNaN(numVal) ? 1 : Math.max(1, numVal));
                                    }
                                }}
                                onBlur={() => {
                                    if (defaultPoints !== "" && Number(defaultPoints) < 1) {
                                        setDefaultPoints(1);
                                    }
                                }}
                                roleColor="primary"
                            />
                        </div>

                        <div className="flex flex-col justify-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <p className="text-sm text-text-muted font-medium">
                                <span className="font-bold text-primary mr-2 uppercase tracking-tight">Configuration:</span>
                                Timer: {defaultTime}s per question • Points: {defaultPoints}
                            </p>
                            <p className="text-[10px] text-text-muted italic mt-1 font-bold uppercase tracking-widest opacity-60">
                                AI will craft diverse questions (MCQs, T/F) based on the content provided.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Back" onClick={onBack || (() => handleClose())} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading || isGenerating} variant='primary' className='flex-2 py-3'>
                            Generate Quiz
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

export default CreateQuizWithAIPopup;
