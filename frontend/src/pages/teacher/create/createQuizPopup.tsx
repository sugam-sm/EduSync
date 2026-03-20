import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { resetQuizState } from '../../../features/learning/quizSllice';
import { Portal } from '../../../components/Portal';
import { ManageQuiz } from '../manage/manageQuiz';
import { CustomDateTimePicker } from '../../../components/Custom/customDateTimePicker';

interface CreateQuizPopupProps {
    isOpen: boolean;
    onClose: () => void;
    gradeId: string | number;
}

export const CreateQuizPopup = ({ isOpen, onClose, gradeId }: CreateQuizPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isError, message } = useSelector((state: RootState) => state.quiz);
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    
    // Step state
    const [step, setStep] = useState(1);

    // Step 1: Metadata
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [topicTag, setTopicTag] = useState("");
    const [defaultTime, setDefaultTime] = useState<number | string>(30);
    const [isActive, setIsActive] = useState(true);
    const [startDatetime, setStartDatetime] = useState("");
    const [endDatetime, setEndDatetime] = useState("");

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetQuizState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = (force = false) => {
        if (!force && (title || description || topicTag)) {
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
        setDescription("");
        setTopicTag("");
        setDefaultTime(30);
        setIsActive(true);
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
            dispatch(addToast({ message: "Default timer must be at least 30 seconds.", type: 'info' }));
            return false;
        }
        if (startDatetime && endDatetime && new Date(startDatetime) >= new Date(endDatetime)) {
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

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                
                {/* Step 1: Metadata Form (Aligned with CreateFlashcardDeckPopup) */}
                <div className={`w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh] transition-all duration-500 ${step === 2 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                    {/* Header */}
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">New Quiz</h2>
                                <p className="text-text-muted mt-1 font-medium">Step 1: Configure Rules & Availability</p>
                            </div>
                            <button type="button" onClick={() => handleClose()} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all duration-300 hover:cursor-pointer hover:rotate-90">
                                <X size={24} strokeWidth={3}/>
                            </button>
                        </div>
                    </div>

                    <div className="px-8 space-y-6 scrollbar-hide flex-1">
                        <CustomInput 
                            label="Quiz Title" 
                            value={title} 
                            onChange={(e: any) => setTitle(e.target.value)} 
                            placeholder="e.g. Geometry Final"
                            roleColor="primary"
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <CustomInput 
                                label="Topic Tag" 
                                value={topicTag} 
                                onChange={(e: any) => setTopicTag(e.target.value)} 
                                placeholder="e.g. Algebra"
                                roleColor="primary"
                            />
                            <CustomInput 
                                label="Timer (Sec)" 
                                type="number"
                                value={defaultTime} 
                                onChange={(e: any) => setDefaultTime(e.target.value === "" ? "" : Number(e.target.value))} 
                                roleColor="primary"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-50">
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

                        <CustomInput 
                            label="Description" 
                            value={description}
                            onChange={(e: any) => setDescription(e.target.value)}
                            roleColor="primary"
                            placeholder="description for the quiz"
                        />

                        <div className="flex items-center gap-4 py-2 pb-4">
                            <label className="text-sm font-semibold text-text-muted">Quiz Status:</label>
                            <button type="button" onClick={() =>
                                setIsActive(!isActive)
                            }
                            className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 hover:cursor-pointer ${
                                isActive ? "bg-success/50" : "bg-failure"
                            }`}
                            >
                            <div
                                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                                isActive ? "translate-x-7" : "translate-x-0"
                                }`}
                            />
                            </button>

                            <span
                            className={`font-bold text-sm ${
                                isActive ? "text-success" : "text-failure"
                            }`}
                            >
                            {isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={() => handleClose()} variant='failure' className='flex-1 py-3' />
                        <FormButton 
                            onClick={() => validateStep1() && setStep(2)} 
                            variant='primary' 
                            className='flex-2 py-3'
                        >
                            Build Questions
                        </FormButton>
                    </div>
                </div>

                {step === 2 && (
                    <ManageQuiz 
                        isOpen={true} 
                        onClose={() => handleClose()} 
                        quiz={{
                            title,
                            description,
                            topic_tag: topicTag,
                            default_time_per_question: defaultTime,
                            start_datetime: startDatetime || null,
                            end_datetime: endDatetime || null,
                            is_published: isActive,
                            grade_id: gradeId as number,
                            questions: []
                        } as any}
                        isStepMode={true}
                        onBack={() => setStep(1)}
                    />
                )}
                
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default CreateQuizPopup;