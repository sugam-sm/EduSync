import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { resetQuizState } from '../../../features/learning/quizSlice';
import { Portal } from '../../../components/Portal';
import { ManageQuiz } from '../manage/manageQuiz';
import { CustomDateTimePicker } from '../../../components/Custom/customDateTimePicker';

interface CreateQuizPopupProps {
    isOpen: boolean;
    onClose: () => void;
    grade: string | number;
    subject: string | number;
    onSwitchToAI?: (title: string, time: number | string, points: number | string, startDatetime: string, endDatetime: string) => void;
}

export const CreateQuizPopup = ({ isOpen, onClose, grade, subject, onSwitchToAI }: CreateQuizPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isError, message } = useSelector((state: RootState) => state.quiz);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    // Step state
    const [step, setStep] = useState(1);

    // Step 1: Metadata
    const [title, setTitle] = useState("");
    const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual');

    const [defaultTime, setDefaultTime] = useState<number | string>(30);
    const [defaultPoints, setDefaultPoints] = useState<number | string>(1);

    const [startDatetime, setStartDatetime] = useState("");
    const [endDatetime, setEndDatetime] = useState("");

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetQuizState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = (force = false) => {
        if (!force && title) {
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
        setTitle("");
        setCreationMode('manual');
        setDefaultTime(30);
        setDefaultPoints(1);

        setStartDatetime("");
        setEndDatetime("");
        onClose();
    };

    const validateStep1 = () => {
        if (!title.trim()) {
            dispatch(addToast({ message: "Quiz title is required.", type: 'info' }));
            return false;
        }
        if (!defaultTime || Number(defaultTime) < 30) {
            dispatch(addToast({ message: "Default timer must be at least 30 seconds and cannot be negative.", type: 'info' }));
            return false;
        }
        if (!defaultPoints || Number(defaultPoints) < 1) {
            dispatch(addToast({ message: "Points per question must be at least 1.", type: 'info' }));
            return false;
        }
        if (!startDatetime) {
            dispatch(addToast({ message: "Start time is required.", type: 'info' }));
            return false;
        }
        if (!endDatetime) {
            dispatch(addToast({ message: "End time is required.", type: 'info' }));
            return false;
        }
        if (new Date(startDatetime) >= new Date(endDatetime)) {
            dispatch(addToast({ message: "End time must be after start time.", type: 'info' }));
            return false;
        }

        openDecidePopup({
            question: "Are you sure you want to start building questions for this quiz?",
            confirmText: "Yes, Continue",
            cancelText: "Cancel",
            variant: "secondary",
            onConfirm: () => setStep(2)
        });
    };

    const quizData = useMemo(() => ({
        title,
        default_time_per_question: defaultTime,
        default_points_per_question: defaultPoints,
        start_datetime: startDatetime || null,
        end_datetime: endDatetime || null,
        is_published: false,
        grade: grade as number,
        subject: subject as number,
        creation_mode: creationMode,
        questions: []
    } as any), [title, defaultTime, defaultPoints, startDatetime, endDatetime, grade, subject, creationMode]);

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">

                {/* Step 1: Metadata Form (Aligned with CreateFlashcardDeckPopup) */}
                <form
                    onSubmit={(e) => { 
                        e.preventDefault(); 
                        if (!grade || grade === "All") {
                            dispatch(addToast({ message: "You have not selected any grade.", type: 'failure' }));
                            return;
                        }
                        if (!subject || subject === "All") {
                            dispatch(addToast({ message: "You have not selected any subject.", type: 'failure' }));
                            return;
                        }
                        if (creationMode === 'ai') {
                            if (!title.trim()) {
                                dispatch(addToast({ message: "Quiz title is required.", type: 'info' }));
                                return;
                            }
                            if (!startDatetime) {
                                dispatch(addToast({ message: "Start time is required.", type: 'info' }));
                                return;
                            }
                            if (!endDatetime) {
                                dispatch(addToast({ message: "End time is required.", type: 'info' }));
                                return;
                            }
                            if (new Date(startDatetime) >= new Date(endDatetime)) {
                                dispatch(addToast({ message: "End time must be after start time.", type: 'info' }));
                                return;
                            }
                            if (!defaultPoints || Number(defaultPoints) < 1) {
                                dispatch(addToast({ message: "Points per question must be at least 1.", type: 'info' }));
                                return;
                            }
                            onSwitchToAI?.(title, defaultTime, defaultPoints, startDatetime, endDatetime);
                            return;
                        }
                        if (validateStep1()) setStep(2); 
                    }}
                    className={`w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh] transition-all duration-500 ${step === 2 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
                >
                    {/* Header */}
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">New Quiz</h2>
                                <p className="text-text-muted mt-1 font-medium">Step 1: Configure Rules & Availability</p>
                            </div>
                            <button type="button" onClick={() => handleClose()} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all duration-300 hover:cursor-pointer hover:rotate-90">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 space-y-6 scrollbar-hide flex-1 overflow-y-auto">
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
                            label="Quiz Title"
                            value={title}
                            onChange={(e: any) => setTitle(e.target.value)}
                            placeholder="e.g. Geometry Final"
                            roleColor="primary"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-50 pb-4">
                            <CustomDateTimePicker
                                label="Start Time"
                                value={startDatetime}
                                onChange={setStartDatetime}
                                roleColor="primary"
                            />
                            <CustomDateTimePicker
                                label="End Time"
                                value={endDatetime}
                                onChange={setEndDatetime}
                                roleColor="primary"
                            />
                        </div>


                    </div>

                    {/* Footer */}
                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={() => handleClose()} variant='failure' className='flex-1 py-3' />
                        <FormButton
                            type="submit"
                            variant='primary'
                            className='flex-2 py-3'
                        >
                            {creationMode === 'manual' ? 'Build Questions' : 'Generate with AI'}
                        </FormButton>
                    </div>
                </form>

                {step === 2 && (
                    <ManageQuiz
                        isOpen={true}
                        onClose={() => handleClose(true)}
                        quiz={quizData}
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

export default CreateQuizPopup;
