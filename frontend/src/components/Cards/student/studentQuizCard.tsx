import { useState, useRef } from 'react';
import { Play, Eye, Clock, HelpCircle, MoreVertical, X } from "lucide-react";
import { type Quiz, type QuizResultType } from "../../../features/learning/quizSllice";
import { ActionButton } from '../../Buttons/actionButton';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../features/toasts/toastSlice';
import { type AppDispatch } from '../../../store';

interface StudentQuizCardProps {
    quiz: Quiz;
    onTakeQuiz: (quiz: Quiz) => void;
    onViewResult?: (result: QuizResultType) => void;
    result?: QuizResultType;
}

export const StudentQuizCard = ({ quiz, onTakeQuiz, onViewResult, result }: StudentQuizCardProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom');
    const cardRef = useRef<HTMLDivElement>(null);

    const now = new Date();
    const startTime = quiz.start_datetime ? new Date(quiz.start_datetime) : null;
    const endTime = quiz.end_datetime ? new Date(quiz.end_datetime) : null;

    const isUpcoming = startTime && now < startTime;
    const isExpired = endTime && now > endTime;
    const isWithinTimeWindow = !isUpcoming && !isExpired;

    const handleTakeQuiz = () => {
        if (!isWithinTimeWindow) {
            const startStr = startTime ? `${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'unspecified';
            const endStr = endTime ? `${endTime.toLocaleDateString()} at ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'unspecified';
            dispatch(addToast({ 
                message: `This quiz is allocated from ${startStr} to ${endStr}.`, 
                type: 'info' 
            }));
            return;
        }
        onTakeQuiz(quiz);
    };

    const toggleActions = () => {
        if (!isActionsOpen && cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            if (window.innerHeight - rect.bottom < 300) {
                setMenuPosition('top');
            } else {
                setMenuPosition('bottom');
            }
        }
        setIsActionsOpen(!isActionsOpen);
    };

    return (
        <div ref={cardRef} className={`relative w-full bg-surface border-3 border-light/10 rounded-xl p-2 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50 ${isActionsOpen ? 'z-20' : 'z-0'}`}>

            {isActionsOpen && (
                <div className={`md:hidden absolute right-2 z-20 bg-surface border border-light/20 p-2 rounded-xl shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 ${menuPosition === 'bottom' ? 'top-[80%]' : 'bottom-[80%]'}`}>
                    {!result ? (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { handleTakeQuiz(); setIsActionsOpen(false); }}>
                            <span className="text-primary font-bold text-sm">
                                {isUpcoming ? "Starts Soon" : isExpired ? "Expired" : "Take Quiz"}
                            </span>
                            <ActionButton 
                                Icon={isUpcoming || isExpired ? Clock : Play} 
                                variant='custom' 
                                onClick={() => {}} 
                                className="p-2!" 
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { onViewResult?.(result); setIsActionsOpen(false); }}>
                            <span className="text-primary font-bold text-sm">View Result</span>
                            <ActionButton Icon={Eye} variant='custom' onClick={() => {}} className="p-2!" />
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center w-full overflow-hidden">
                <div className="flex items-center gap-4 w-full min-w-0">
                    <div className="hidden md:block p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <HelpCircle size={24} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 text-left">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-primary truncate" title={quiz.title}>
                                {quiz.title}
                            </h3>
                            {result && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shrink-0 ${result.total_score > 0 ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                                    Score: {result.total_score}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-1 text-primary/70">
                                <Clock size={12} className="shrink-0" />
                                <span className="truncate">{quiz.default_time_per_question || 60}s Per Question</span>
                            </div>
                            
                            {isUpcoming && startTime && (
                                <span className="text-warning flex items-center gap-1">
                                    • Opens: {startTime.toLocaleDateString()} {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {isExpired && (
                                <span className="text-failure flex items-center gap-1">
                                    • Expired
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <div className="hidden md:flex gap-1">
                        {!result ? (
                            <ActionButton 
                                Icon={isUpcoming || isExpired ? Clock : Play} 
                                variant='custom' 
                                onClick={handleTakeQuiz} 
                                title={isUpcoming ? "Not Started" : isExpired ? "Expired" : "Take Quiz"} 
                                className="p-2!"
                            />
                        ) : (
                            <ActionButton 
                                Icon={Eye} 
                                variant='custom' 
                                onClick={() => onViewResult?.(result)} 
                                title="View Result" 
                                className="p-2!" 
                            />
                        )}
                    </div>

                    <button
                        onClick={toggleActions}
                        className={`md:hidden hover:cursor-pointer p-1 rounded-full transition-all duration-300 ${isActionsOpen ? 'text-failure hover:bg-failure/20' : 'hover:bg-primary/10 text-primary'}`}
                    >
                        {isActionsOpen ? <X size={20} strokeWidth={2.5} /> : <MoreVertical size={20} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
