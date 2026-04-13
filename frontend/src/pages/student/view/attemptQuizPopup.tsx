import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Clock, ClipboardList, Shield, HelpCircle, Timer } from "lucide-react";

import { Button } from '../../../components/Buttons/customButton';
import { FormButton } from '../../../components/Buttons/formButton';
import { DecisionPopup } from '../../../components/decision popup';
import { Portal } from '../../../components/Portal';

import { type AppDispatch, type RootState } from '../../../store';
import { type Quiz, startQuizAction, submitAnswerAction, finishQuizAction } from '../../../features/learning/quizSlice';
import { addToast } from '../../../features/toasts/toastSlice';

interface AttemptQuizPopupProps {
    isOpen: boolean;
    onClose: () => void;
    quiz: Quiz;
}

export const AttemptQuizPopup = ({ isOpen, onClose, quiz }: AttemptQuizPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isQuizLoading, activeAttempt } = useSelector((state: RootState) => state.quiz);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isStarted, setIsStarted] = useState(false);
    const [showLobby, setShowLobby] = useState(true);
    const [isTimerInitialized, setIsTimerInitialized] = useState(false);

    const now = new Date();
    const startTime = quiz.start_datetime ? new Date(quiz.start_datetime) : null;
    const endTime = quiz.end_datetime ? new Date(quiz.end_datetime) : null;
    const isUpcoming = startTime && now < startTime;
    const isExpired = endTime && now > endTime;
    const isWithinTimeWindow = !isUpcoming && !isExpired;

    // Tracking time for behavioral analytics
    const questionStartTimeRef = useRef<number>(0);
    const isSubmittingRef = useRef(false);

    const questions = quiz.questions || [];
    const currentQuestion = questions[currentIdx];

    const totalPoints = questions.reduce((sum, q) => sum + (q.points_override || 1), 0);

    // Reset/Initialize Timer for current question
    useEffect(() => {
        if (currentQuestion && isStarted && !showLobby) {
            const timeLimit = Number(currentQuestion.time_override_seconds || quiz.default_time_per_question || 60);
            setTimeLeft(timeLimit);
            setIsTimerInitialized(true);
            questionStartTimeRef.current = Date.now();
        }
    }, [currentIdx, currentQuestion, quiz.default_time_per_question, isStarted, showLobby]);

    const handleFinish = useCallback(async (isAuto = false) => {
        if (!quiz.id || isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        const result = await dispatch(finishQuizAction({ quizId: quiz.id, auto_submitted: isAuto }));
        if (finishQuizAction.fulfilled.match(result)) {
            dispatch(addToast({
                message: isAuto ? "Assessment auto-submitted. Well done!" : "Assessment completed successfully!",
                type: 'success'
            }));
            onClose();
        }
        isSubmittingRef.current = false;
    }, [quiz.id, dispatch, onClose]);

    // Auto-submit current answer and move to next on timer expiry
    const handleTimeUp = useCallback(async () => {
        if (!activeAttempt || !currentQuestion || !quiz.id || isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
        const existingResponse = activeAttempt?.responses?.find(r => r.question === currentQuestion.id);

        // If no answer was selected, submit with null (unanswered)
        if (!existingResponse) {
            await dispatch(submitAnswerAction({
                quizId: quiz.id,
                data: {
                    question: currentQuestion.id!,
                    selected_choice: null as any,
                    time_taken_seconds: timeTaken
                }
            }));
        }

        isSubmittingRef.current = false;
        setIsTimerInitialized(false); // Reset for next question

        // Move to next question or finish
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
        } else {
            handleFinish(true);
        }
    }, [activeAttempt, currentQuestion, quiz.id, currentIdx, questions.length, dispatch, handleFinish]);

    const handleNext = useCallback(async () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
        } else {
            handleFinish();
        }
    }, [currentIdx, questions.length, handleFinish]);

    // Timer countdown
    useEffect(() => {
        if (!isStarted || showLobby || timeLeft === null || timeLeft <= 0 || !isTimerInitialized) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [isStarted, showLobby, timeLeft, isTimerInitialized]);

    // Handle time up automatically
    useEffect(() => {
        if (isStarted && !showLobby && timeLeft === 0 && isTimerInitialized) {
            handleTimeUp();
        }
    }, [timeLeft, isStarted, showLobby, handleTimeUp, isTimerInitialized]);

    // Start Quiz Session
    const handleStartQuiz = async () => {
        if (!isWithinTimeWindow) {
            const startStr = startTime ? `${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'unspecified';
            const endStr = endTime ? `${endTime.toLocaleDateString()} at ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'unspecified';
            dispatch(addToast({
                message: `This assessment is allocated from ${startStr} to ${endStr}.`,
                type: 'info'
            }));
            return;
        }

        if (quiz.id) {
            const result = await dispatch(startQuizAction(quiz.id));
            if (startQuizAction.fulfilled.match(result)) {
                setIsStarted(true);
                setShowLobby(false);
            }
        }
    };

    const handleSelectAnswer = async (choiceId: number) => {
        if (!activeAttempt || !currentQuestion || !quiz.id) return;

        const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

        await dispatch(submitAnswerAction({
            quizId: quiz.id,
            data: {
                question: currentQuestion.id!,
                selected_choice: choiceId,
                time_taken_seconds: timeTaken
            }
        }));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    };

    if (!isOpen) return null;

    if (showLobby) {
        return (
            <Portal>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md overflow-hidden">
                    <div className="w-full max-w-lg bg-surface border-3 border-light/10 rounded-2xl flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-300 relative">

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 hover:bg-failure/20 rounded-full text-text-muted hover:text-failure transition-all hover:rotate-90 duration-300 hover:cursor-pointer"
                        >
                            <X size={25} strokeWidth={3} />
                        </button>

                        {/* Quiz Icon & Title */}
                        <div className="flex flex-col items-center gap-4 mb-6 sm:mb-8 pt-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                                <ClipboardList size={32} strokeWidth={2.5} />
                            </div>
                            <div className="text-center px-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-tighter line-clamp-2">{quiz.title}</h2>
                            </div>
                        </div>

                        {/* Quiz Stats */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
                            <div className="bg-light/5 border-2 border-light/5 rounded-2xl p-3 sm:p-4 text-center">
                                <HelpCircle size={18} className="text-primary mx-auto mb-1.5" />
                                <p className="text-base sm:text-lg font-semibold text-text-heading">{questions.length}</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-text-muted uppercase tracking-widest">Questions</p>
                            </div>
                            <div className="bg-light/5 border-2 border-light/5 rounded-2xl p-3 sm:p-4 text-center">
                                <Timer size={18} className="text-primary mx-auto mb-1.5" />
                                <p className="text-base sm:text-lg font-semibold text-text-heading">{quiz.default_time_per_question || 60}s</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-text-muted uppercase tracking-widest">Per Question</p>
                            </div>
                            <div className="bg-light/5 border-2 border-light/5 rounded-2xl p-3 sm:p-4 text-center">
                                <Shield size={18} className="text-primary mx-auto mb-1.5" />
                                <p className="text-base sm:text-lg font-semibold text-text-heading">{totalPoints}</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-text-muted uppercase tracking-widest">Total Points</p>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="bg-light/3 border-2 border-light/5 rounded-2xl p-5 mb-8 space-y-3">
                            <h4 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                                Quiz Rules
                            </h4>
                            <ul className="text-sm font-semibold text-text-muted space-y-2 list-none">
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary rounded-full" /> Each question has a time limit
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary rounded-full" /> The quiz auto-submits on time expiry
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary rounded-full" /> Once started, you cannot exit the quiz until completion.
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary rounded-full" /> Cannot re-attempt if discarded or exited.
                                </li>
                            </ul>
                        </div>

                        {/* Start Button */}
                        <div className="space-y-4">
                            {!isWithinTimeWindow && (
                                <div className="flex items-center gap-2 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl text-primary text-center justify-center">
                                    <Clock size={18} />
                                    <p className="text-xs font-bold uppercase tracking-tight">
                                        {isUpcoming
                                            ? `Opens: ${startTime?.toLocaleDateString()} ${startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                            : "This assessment has expired"
                                        }
                                    </p>
                                </div>
                            )}
                            <FormButton
                                onClick={() => openDecidePopup({
                                    question: "Are you sure you want to start this assessment? You cannot re-attempt once started.",
                                    confirmText: "Yes, Start",
                                    cancelText: "Not Yet",
                                    variant: "primary",
                                    onConfirm: () => handleStartQuiz()
                                })}
                                isLoading={isQuizLoading}
                                className="w-full py-5 text-base font-black uppercase tracking-widest"
                            >
                                 Start Now
                            </FormButton>
                        </div>
                    </div>
                    <DecidePopup />
                </div>
            </Portal>
        );
    }

    if (!currentQuestion) return null;

    const isAnswered = activeAttempt?.responses?.some(r => r.question === currentQuestion.id);
    const selectedChoiceId = activeAttempt?.responses?.find(r => r.question === currentQuestion.id)?.selected_choice;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md overflow-hidden">
                <div className="w-[96%] sm:w-[90%] md:w-[90%] lg:w-[75%] xl:w-[65%] 2xl:w-[50%] h-[92vh] sm:h-[90vh] sm:max-h-[850px] flex flex-col border-light/40 border-2 rounded-2xl overflow-hidden bg-surface relative shadow-2xl transition-all duration-300">
                    
                    {/* Header Section */}
                    <div className="flex justify-between items-start p-5 sm:p-6 pb-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-tight">Question {currentIdx + 1} out of {questions.length}</h2>
                            
                            {/* Mobile-only Stats: Below question number */}
                            <div className="flex sm:hidden items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-primary/15 bg-primary/5 text-primary">
                                    <span className="font-bold text-xs tabular-nums uppercase tracking-widest">{currentQuestion.points_override || 1} points</span>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all ${timeLeft !== null && timeLeft < 10 
                                    ? 'bg-failure/10 border-failure/30 text-failure animate-pulse' 
                                    : 'bg-primary/5 border-primary/15 text-primary'}`}>
                                    <Clock size={14} />
                                    <span className="font-bold text-xs tabular-nums">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 border-primary/15 bg-primary/5 text-primary">
                                    <span className="font-bold text-xs tabular-nums uppercase tracking-widest">{currentQuestion.points_override || 1} points</span>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 transition-all ${timeLeft !== null && timeLeft < 10 
                                    ? 'bg-failure/10 border-failure/30 text-failure animate-pulse' 
                                    : 'bg-primary/5 border-primary/15 text-primary'}`}>
                                    <Clock size={16} />
                                    <span className="font-bold text-xs tabular-nums">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => openDecidePopup({
                                    question: "Are you sure you want to quit? Your progress will be saved but you cannot re-attempt.",
                                    confirmText: "Quit Now",
                                    cancelText: "Stay & Finish",
                                    variant: "primary",
                                    onConfirm: () => { handleFinish(); onClose(); }
                                })}
                                className="p-2 hover:bg-failure/20 hover:text-failure rounded-full transition-all duration-300 text-text-muted hover:cursor-pointer hover:rotate-90"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto">
                        <div className="flex-1 flex flex-col gap-6 w-full h-full">

                            {/* Question Box*/}
                            <div className="w-full min-h-[160px] sm:h-[200px] overflow-y-auto text-text-heading bg-light/5 border-2 border-light/10 rounded-2xl p-5 sm:p-6 font-semibold text-lg sm:text-2xl flex items-center justify-center text-center">
                                <span className="w-full">{currentQuestion.question_text}</span>
                            </div>

                            {/* Choices List */}
                            <div className="grid grid-cols-1 gap-3 overflow-y-auto pb-2">
                                {currentQuestion.choices?.map((choice, idx) => {
                                    const isSelected = selectedChoiceId === choice.id;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectAnswer(choice.id!)}
                                            className={`relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all group text-left cursor-pointer ${isSelected
                                                    ? 'bg-primary/10 border-primary shadow-sm shadow-primary/20'
                                                    : 'bg-light/3 border-light/10 hover:border-primary/40 transition-all duration-300'
                                                }`}
                                        >
                                            <span className={`text-base sm:text-lg font-black mr-1 sm:mr-2 transition-all ${isSelected ? 'text-primary' : 'text-text-muted group-hover:text-primary transition-all duration-300'}`}>
                                                {String.fromCharCode(65 + idx)}.
                                            </span>
                                            <span className={`flex-1 text-base sm:text-lg font-bold leading-tight ${isSelected ? 'text-primary' : 'text-text-muted group-hover:text-primary transition-all duration-300'}`}>
                                                {choice.choice_text}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>


                        </div>

                        {/* Footer Navigation */}
                        <div className="w-full flex justify-end mt-2 sm:mt-4 pb-2">
                            <div className="w-full sm:w-[50%] md:w-[40%] flex gap-4">
                                {currentIdx < questions.length - 1 ? (
                                    <Button
                                        label="Confirm & Next"
                                        onClick={isAnswered ? handleNext : () => dispatch(addToast({ message: "Select an answer first!", type: 'info' }))}
                                        variant='primary'
                                        className='flex-1 h-12 sm:h-14 font-black tracking-widest uppercase transition-all'
                                    />
                                ) : (
                                    <FormButton
                                        onClick={() => {
                                            if (isAnswered) {
                                                openDecidePopup({
                                                    question: "Finish and submit assessment?",
                                                    confirmText: "Yes, Finish",
                                                    cancelText: "Review",
                                                    variant: "primary",
                                                    onConfirm: () => handleFinish()
                                                });
                                            } else {
                                                dispatch(addToast({ message: "Select an answer first!", type: 'info' }));
                                            }
                                        }}
                                        isLoading={isQuizLoading}
                                        variant='primary'
                                        className='flex-1 h-12 sm:h-14 font-black tracking-widest uppercase border-primary/40 border-2'
                                    >
                                        Finish
                                    </FormButton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default AttemptQuizPopup;
