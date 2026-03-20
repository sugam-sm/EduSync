import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Save } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { type Quiz, updateQuiz, resetQuizState } from '../../../features/learning/quizSllice';
import { Portal } from '../../../components/Portal';
import { CustomDateTimePicker } from '../../../components/Custom/customDateTimePicker';

interface UpdateQuizPopupProps {
    isOpen: boolean;
    onClose: () => void;
    quiz: Quiz | null;
}

export const UpdateQuizPopup = ({ isOpen, onClose, quiz }: UpdateQuizPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, message } = useSelector((state: RootState) => state.quiz);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const [title, setTitle] = useState("");
    const [timeLimit, setTimeLimit] = useState<number | string>("");
    const [isActive, setIsActive] = useState(false);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // Helper to format ISO string to datetime-local input value
    const formatForInput = (isoString: string | null | undefined) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60 * 1000);
        return local.toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (quiz) {
            setTitle(quiz.title);
            setTimeLimit(quiz.default_time_per_question || 0);
            setIsActive(quiz.is_published || false);
            setStartTime(formatForInput(quiz.start_datetime));
            setEndTime(formatForInput(quiz.end_datetime));
        }
    }, [quiz]);

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetQuizState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = () => {
        if (quiz) {
            setTitle(quiz.title);
            setTimeLimit(quiz.default_time_per_question || 0);
            setIsActive(quiz.is_published || false);
            setStartTime(formatForInput(quiz.start_datetime));
            setEndTime(formatForInput(quiz.end_datetime));
        }
        onClose();
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!quiz || !quiz.id) return;

        if (!title.trim()) {
            dispatch(addToast({ message: "Quiz title is required.", type: 'info' }));
            return;
        }

        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            dispatch(addToast({ message: "End time must be after start time.", type: 'info' }));
            return;
        }

        // Check if anything has changed
        const noChanges = 
            title === quiz.title && 
            timeLimit === (quiz.default_time_per_question || 0) && 
            isActive === quiz.is_published &&
            startTime === formatForInput(quiz.start_datetime) &&
            endTime === formatForInput(quiz.end_datetime);

        if (noChanges) {
            dispatch(addToast({ message: "No changes detected.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: `Save changes to "${title}"?`,
            confirmText: "Yes, Save",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(updateQuiz({
                    id: quiz.id!,
                    data: {
                        title,
                        default_time_per_question: Number(timeLimit),
                        is_published: isActive,
                        start_datetime: startTime ? new Date(startTime).toISOString() : null,
                        end_datetime: endTime ? new Date(endTime).toISOString() : null,
                    }
                }));

                if (updateQuiz.fulfilled.match(result)) {
                    dispatch(addToast({ message: 'Quiz updated successfully.', type: 'success' }));
                    onClose();
                }
            }
        });
    };

    if (!isOpen || !quiz) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col h-[80vh] sm:h-[60vh]">
                    <div className="px-8 pt-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">Update Quiz</h2>
                                <p className="text-text-muted mt-1 font-medium">Edit settings for your quiz</p>
                            </div>
                            <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3}/>
                            </button>
                        </div>
                    </div>

                    <div className="px-8 space-y-6 flex-1 flex flex-col justify-center">
                        <CustomInput 
                            label="Quiz Title" 
                            value={title} 
                            onChange={(e: any) => setTitle(e.target.value)} 
                            placeholder="Enter quiz title"
                            roleColor="primary"
                        />
                        
                        <CustomInput 
                            label="Time Limit (Minutes)" 
                            type="number"
                            value={timeLimit} 
                            onChange={(e: any) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))} 
                            roleColor="primary"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-50">
                            <CustomDateTimePicker
                                label="Start Time"
                                value={startTime}
                                onChange={setStartTime}
                            />

                            <CustomDateTimePicker
                                label="End Time"
                                value={endTime}
                                onChange={setEndTime}
                            />
                            </div>

                        <div className="flex items-center gap-4 py-2 border-b border-light/10 pb-4">
                            <label className="text-sm font-semibold text-text-muted">Account Status:</label>
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

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
                            <Save size={20} /> Save Changes
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};