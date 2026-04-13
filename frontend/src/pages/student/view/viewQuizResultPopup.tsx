import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { CheckCircle2, X, Clock, ChevronLeft, Check, AlertTriangle } from "lucide-react";
import { Portal } from '../../../components/Portal';
import { Button } from '../../../components/Buttons/customButton';
import { addToast } from '../../../features/toasts/toastSlice';
import { type Quiz, type QuizAttempt } from '../../../features/learning/quizSlice';
import { type AppDispatch } from '../../../store';

interface ViewQuizResultPopupProps {
    isOpen: boolean;
    onClose: () => void;
    result: QuizAttempt | null;
    quiz: Quiz | undefined;
}

export const ViewQuizResultPopup = ({ isOpen, onClose, result, quiz }: ViewQuizResultPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const [showReview, setShowReview] = useState(false);

    if (!isOpen || !result) return null;

    const totalPoints = quiz?.questions?.reduce((acc, q) => acc + (q.points_override || 1), 0) || 1;
    const percentage = Math.round((result.total_score / totalPoints) * 100) || 0;
    const isPassed = percentage >= 50;

    const renderSummary = () => (
        <>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mt-4 mb-6 border-2 transition-all duration-300 ${isPassed ? 'bg-success/10 text-success border-success/20' : 'bg-failure/10 text-failure border-failure/20 '
                }`}>
                <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-primary uppercase tracking-tighter mb-2 line-clamp-2 px-4">
                {quiz?.title || 'Assessment Summary'}
            </h2>

            <p className="text-sm font-bold text-text-muted mb-8 tracking-wider flex items-center gap-2">
                <Clock size={12} strokeWidth={3} />
                Completed {new Date(result.completed_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>

            <div className="w-full bg-light/5 border-2 border-primary/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center mb-8 relative group overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-1.5 ${isPassed ? 'bg-success' : 'bg-failure'}`} />

                <span className="font-bold text-text-muted uppercase tracking-[0.25em] mb-4">Quiz Score</span>

                <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-6xl sm:text-7xl font-black tracking-tighter tabular-nums ${isPassed ? 'text-success' : 'text-failure'}`}>
                        {result.total_score}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-text-muted opacity-20">/ {totalPoints}</span>
                </div>

                <div className={`px-4 py-1.5 rounded-xl font-bold text-lg border-2 tracking-tighter ${isPassed ? 'bg-success/10 text-success border-success/15' : 'bg-failure/10 text-failure border-failure/15'
                    }`}>
                    {percentage}% Accuracy
                </div>

                <div className="mt-6 w-full max-w-[240px]">
                    <div className="h-2.5 w-full bg-light/10 rounded-full overflow-hidden border border-light/5 p-0.5">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${isPassed ? 'bg-success shadow-success/20' : 'bg-failure shadow-failure/20'
                                }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col gap-3">
                <Button
                    label="Review Answers"
                    onClick={() => {
                        const now = new Date();
                        const closingTime = quiz?.end_datetime ? new Date(quiz.end_datetime) : null;
                        
                        if (closingTime && now < closingTime) {
                            dispatch(addToast({ 
                                message: `Review is disabled until the quiz closes at ${closingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`, 
                                type: 'info' 
                            }));
                            return;
                        }
                        setShowReview(true);
                    }}
                    variant="primary"
                    className="w-full h-14 text-base font-bold uppercase tracking-widest rounded-2xl border-primary/20 text-text-heading hover:bg-primary/5"
                />
                <Button
                    label="Done"
                    onClick={onClose}
                    variant="primary"
                    className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl"
                />
            </div>
        </>
    );

    const renderReview = () => (
        <div className="w-full flex flex-col h-full max-h-[70vh] items-start text-left">
            <button
                onClick={() => setShowReview(false)}
                className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6 font-bold uppercase text-xs tracking-widest group cursor-pointer"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Summary
            </button>

            <div className="w-full overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {quiz?.questions?.map((question, qIdx) => {
                    const studentResponse = result.responses?.find(r => r.question === question.id);
                    const selectedChoiceId = studentResponse?.selected_choice;

                    return (
                        <div key={qIdx} className="bg-light/3 border-2 border-light/5 rounded-2xl p-5 sm:p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0 mt-1">
                                    {qIdx + 1}
                                </span>
                                <h3 className="text-lg font-bold text-text-heading leading-snug">
                                    {question.question_text}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pl-11">
                                {question.choices.map((choice, cIdx) => {
                                    const isSelected = selectedChoiceId === choice.id;
                                    const isCorrect = choice.is_correct;

                                    let variantClasses = "bg-light/3 border-light/5 text-text-muted";
                                    let Icon = null;

                                    if (isSelected && isCorrect) {
                                        variantClasses = "bg-success/10 border-success text-success shadow-sm shadow-success/10";
                                        Icon = Check;
                                    } else if (isSelected && !isCorrect) {
                                        variantClasses = "bg-failure/10 border-failure text-failure shadow-sm shadow-failure/10";
                                        Icon = X;
                                    } else if (!isSelected && isCorrect) {
                                        variantClasses = "bg-success/5 border-success/30 text-success/70 border-dashed";
                                        Icon = Check;
                                    }

                                    return (
                                        <div
                                            key={cIdx}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${variantClasses}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-current' : 'border-light/10'
                                                }`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                                            </div>
                                            <span className="flex-1 text-sm font-semibold">{choice.choice_text}</span>
                                            {Icon && <Icon size={14} className="shrink-0" />}
                                        </div>
                                    );
                                })}

                                {!selectedChoiceId && (
                                    <p className="text-[10px] font-bold text-failure uppercase tracking-widest flex items-center gap-1.5 mt-2">
                                        <AlertTriangle size={12} /> Unanswered
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md overflow-hidden">
                <div className={`bg-surface border-2 border-light/10 rounded-2xl flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-300 relative overflow-hidden transition-all ${showReview ? 'w-[96%] max-w-2xl' : 'w-[96%] max-w-lg items-center text-center'
                    }`}>

                    {/* Glassy Background */}
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-xl pointer-events-none" />

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-failure/20 rounded-full text-text-muted hover:text-failure transition-all hover:rotate-90 duration-300 hover:cursor-pointer z-10"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>

                    {showReview ? renderReview() : renderSummary()}
                </div>
            </div>
        </Portal>
    );
};

export default ViewQuizResultPopup;
