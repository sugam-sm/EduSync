import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, CheckCircle2, Clock, ChevronRight, Send, AlertTriangle, Zap, Shield, HelpCircle, Timer } from "lucide-react";

import { Button } from '../../../components/Buttons/customButton';
import { FormButton } from '../../../components/Buttons/formButton';
import { DecisionPopup } from '../../../components/decision popup';
import { Portal } from '../../../components/Portal';

import { type AppDispatch, type RootState } from '../../../store';
import { 
    type Quiz, 
    startQuizAction, 
    submitAnswerAction, 
    finishQuizAction
} from '../../../features/learning/quizSllice';
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

    // ===== QUIZ LOBBY SCREEN =====
    if (showLobby) {
        return (
            <Portal>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/95 backdrop-blur-md overflow-hidden">
                    <div className="w-full max-w-lg bg-surface border-2 border-light/10 rounded-[2.5rem] shadow-2xl flex flex-col p-10 animate-in zoom-in-95 duration-300 relative">
                        
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>

                        {/* Quiz Icon & Title */}
                        <div className="flex flex-col items-center gap-4 mb-8">
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                                <Zap size={40} strokeWidth={2} />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">{quiz.title}</h2>
                            </div>
                        </div>

                        {/* Quiz Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="bg-light/5 border-2 border-light/10 rounded-2xl p-4 text-center">
                                <HelpCircle size={20} className="text-primary mx-auto mb-1" />
                                <p className="text-lg font-black text-text-heading">{questions.length}</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Questions</p>
                            </div>
                            <div className="bg-light/5 border-2 border-light/10 rounded-2xl p-4 text-center">
                                <Timer size={20} className="text-primary mx-auto mb-1" />
                                <p className="text-lg font-black text-text-heading">{quiz.default_time_per_question || 60}s</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Per Q</p>
                            </div>
                            <div className="bg-light/5 border-2 border-light/10 rounded-2xl p-4 text-center">
                                <Shield size={20} className="text-primary mx-auto mb-1" />
                                <p className="text-lg font-black text-text-heading">{totalPoints}</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Points</p>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="bg-failure/5 border-2 border-failure/15 rounded-2xl p-5 mb-8 space-y-2">
                            <h4 className="text-xs font-black text-failure uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle size={14} /> Assessment Rules
                            </h4>
                            <ul className="text-sm font-semibold text-text-muted space-y-1.5 list-disc list-inside">
                                <li>Each question has a strict time limit</li>
                                <li>No backtracking to previous questions</li>
                                <li>Unanswered questions auto-submit when time runs out</li>
                                <li>You cannot re-attempt this quiz</li>
                            </ul>
                        </div>

                        {/* Start Button */}
                        <div className="space-y-4">
                            {!isWithinTimeWindow && (
                                <div className="flex items-center gap-2 p-4 bg-warning/10 border-2 border-warning/20 rounded-2xl text-warning">
                                    <Clock size={20} />
                                    <p className="text-sm font-bold">
                                        {isUpcoming 
                                            ? `Available from: ${startTime?.toLocaleDateString()} ${startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                            : "This assessment has expired and is no longer available."
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
                                <Zap size={20} className="mr-2" /> {isUpcoming ? 'Not Started' : isExpired ? 'Expired' : 'Start Quiz'}
                            </FormButton>
                        </div>
                    </div>
                    <DecidePopup />
                </div>
            </Portal>
        );
    }

    // ===== QUIZ ATTEMPT SCREEN =====
    if (!currentQuestion) return null;

    const isAnswered = activeAttempt?.responses?.some(r => r.question === currentQuestion.id);
    const selectedChoiceId = activeAttempt?.responses?.find(r => r.question === currentQuestion.id)?.selected_choice;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/95 backdrop-blur-md overflow-hidden">
                <div className="w-full max-w-4xl bg-surface border-2 border-light/10 rounded-[2.5rem] shadow-2xl flex flex-col h-[90vh] relative">
                    
                    {/* Security Overlay - Danger Zone pulse if time low */}
                    {timeLeft !== null && timeLeft < 5 && (
                        <div className="absolute inset-0 border-4 border-failure/20 rounded-[2.5rem] animate-pulse pointer-events-none z-10" />
                    )}

                    {/* Progress Bar */}
                    <div className="h-2 bg-light/5 rounded-t-[2.5rem] overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                        />
                    </div>

                    {/* Header */}
                    <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-light/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-primary tracking-tight">Question {currentIdx + 1} of {questions.length}</h3>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Standard Assessment</p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all ${
                            timeLeft !== null && timeLeft < 10 
                            ? 'bg-failure/10 border-failure/40 text-failure scale-110' 
                            : 'bg-primary/5 border-primary/20 text-primary'
                        }`}>
                            <Clock size={18} className={timeLeft !== null && timeLeft < 10 ? 'animate-spin-slow' : ''} />
                            <span className="font-black text-lg tabular-nums">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto px-8 py-10 flex flex-col gap-10 scrollbar-hide">
                        
                        {/* Question Text */}
                        <div className="relative p-8 bg-light/5 border-2 border-light/10 rounded-[2rem] text-center min-h-[200px] flex items-center justify-center group">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-surface border-2 border-light/10 px-4 py-1 rounded-full text-[10px] font-black tracking-widest text-text-muted uppercase group-hover:text-primary transition-colors">
                                Requirement
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-text-heading leading-tight tracking-tight px-4">
                                {currentQuestion.question_text}
                            </p>
                        </div>

                        {/* Choices */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.choices?.map((choice, idx) => {
                                const isSelected = selectedChoiceId === choice.id;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectAnswer(choice.id!)}
                                        className={`group relative flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-200 text-left ${
                                            isSelected
                                            ? 'bg-primary border-primary text-surface shadow-xl shadow-primary/20'
                                            : 'bg-surface/50 border-light/10 text-text-muted hover:border-primary/40 hover:bg-primary/5 active:scale-95'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-surface text-primary' : 'bg-light/10 text-text-muted group-hover:bg-primary/20 group-hover:text-primary'
                                        }`}>
                                            <span className="font-black text-sm">{String.fromCharCode(65 + idx)}</span>
                                        </div>
                                        <span className={`flex-1 text-lg font-bold leading-tight ${isSelected ? 'text-surface' : 'group-hover:text-text-heading'}`}>
                                            {choice.choice_text}
                                        </span>
                                        {isSelected && (
                                            <div className="absolute right-4">
                                                <CheckCircle2 size={24} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className="p-8 bg-light/3 border-t border-light/5 flex flex-col sm:flex-row gap-4">
                        <div className="hidden sm:flex items-center gap-3 text-failure font-bold text-xs bg-failure/10 px-4 py-2 rounded-xl border border-failure/20">
                            <AlertTriangle size={14} />
                            <span>NO BACKTRACKING ENABLED</span>
                        </div>
                        
                        <div className="flex-1 flex gap-4">
                            {currentIdx < questions.length - 1 ? (
                                <Button 
                                    label="Confirm & Next" 
                                    Icon={ChevronRight}
                                    onClick={isAnswered ? handleNext : () => dispatch(addToast({message: "Select an answer first!", type: 'info'}))}
                                    variant='primary' 
                                    className='flex-1 h-16 font-black tracking-widest uppercase transition-all' 
                                />
                            ) : (
                                <FormButton 
                                    onClick={() => {
                                        if (isAnswered) {
                                            openDecidePopup({
                                                question: "Are you sure you want to finish the assessment?",
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
                                    className='flex-1 h-16 font-black tracking-widest uppercase bg-green-500 hover:bg-green-600 border-green-400 border-2'
                                >
                                    <Send size={20} className="mr-2" /> Finish Assessment
                                </FormButton>
                            )}
                        </div>
                    </div>

                    {/* Decision Popup for Early Exit */}
                    <button 
                        onClick={() => openDecidePopup({
                            question: "Are you sure you want to quit? Your progress will be saved but you cannot re-attempt.",
                            confirmText: "Quit Now",
                            cancelText: "Stay & Finish",
                            variant: "primary",
                            onConfirm: () => { handleFinish(); onClose(); }
                        })}
                        className="absolute -top-3 -right-3 w-10 h-10 bg-failure text-surface rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20 border-2 border-surface"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default AttemptQuizPopup;
