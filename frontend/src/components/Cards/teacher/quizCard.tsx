import { useState, useRef } from 'react';
import { Edit2, Settings, Clock, HelpCircle, MoreVertical, X, Trash2, ClipboardCheck } from "lucide-react";
import { useDispatch } from "react-redux";
import { type Quiz, deleteQuiz } from "../../../features/learning/quizSllice";
import { type AppDispatch } from "../../../store";
import { addToast } from "../../../features/toasts/toastSlice";
import { DecisionPopup } from '../../decision popup';
import { ActionButton } from '../../Buttons/actionButton';

interface QuizCardProps {
    quiz: Quiz;
    onEdit?: (quiz: Quiz) => void;
    onModify?: (quiz: Quiz) => void;
    onEvaluate?: (quiz: Quiz) => void;
}

export const QuizCard = ({ quiz, onEdit, onModify, onEvaluate }: QuizCardProps) => {
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const dispatch = useDispatch<AppDispatch>();

    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom');
    const cardRef = useRef<HTMLDivElement>(null);

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

    const handleDelete = () => {
        openDecidePopup({
            question: `Permanently delete quiz '${quiz.title}'?`,
            confirmText: "Yes, Delete",
            cancelText: "Cancel",
            variant: 'primary',
            onConfirm: async () => {
                const resultAction = await dispatch(deleteQuiz(quiz.id!));
                if (deleteQuiz.fulfilled.match(resultAction)) {
                    dispatch(addToast({
                        message: `Quiz '${quiz.title}' deleted successfully`,
                        type: 'success'
                    }));
                }
            }
        });
    };

    return (
        <div ref={cardRef} className={`relative w-full bg-surface border-3 border-light/10 rounded-xl p-2 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50 ${isActionsOpen ? 'z-20' : 'z-0'}`}>

            {isActionsOpen && (
                <div className={`md:hidden absolute right-2 z-20 bg-surface border border-light/20 p-2 rounded-xl shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 ${menuPosition === 'bottom' ? 'top-[80%]' : 'bottom-[80%]'}`}>
                    {onEdit && <ActionButton Icon={Edit2} variant='custom' onClick={() => { onEdit(quiz); setIsActionsOpen(false); }} className="p-2!" />}
                    {onModify && <ActionButton Icon={Settings} variant='custom' onClick={() => { onModify(quiz); setIsActionsOpen(false); }} className="p-2!" />}
                    {onEvaluate && quiz.is_active && <ActionButton Icon={ClipboardCheck} variant='custom' onClick={() => { onEvaluate(quiz); setIsActionsOpen(false); }} className="p-2!" />}
                    {onEdit && <ActionButton Icon={Trash2} variant='failure' onClick={() => { handleDelete(); setIsActionsOpen(false); }} className="p-2!" />}
                </div>
            )}

            <div className="flex justify-between items-center w-full overflow-hidden">
                <div className="flex items-center gap-4 w-full min-w-0">
                    <div className="hidden md:block p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <HelpCircle size={24} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-primary truncate" title={quiz.title}>
                                {quiz.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shrink-0 ${quiz.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {quiz.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary/70">
                            <Clock size={12} className="shrink-0" />
                            <span className="truncate">{quiz.default_time_per_question || 60}s Per Question</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <div className="hidden md:flex gap-1">
                        {onEdit && <ActionButton Icon={Edit2} variant='custom' onClick={() => onEdit(quiz)} title="Edit Settings" className="p-2!" />}
                        {onModify && <ActionButton Icon={Settings} variant='custom' onClick={() => onModify(quiz)} title="Manage Questions" className="p-2!" />}
                        {onEvaluate && quiz.is_active && <ActionButton Icon={ClipboardCheck} variant='custom' onClick={() => onEvaluate(quiz)} title="Evaluate Remarks" className="p-2!" />}
                        {onEdit && <ActionButton Icon={Trash2} variant='failure' onClick={handleDelete} title="Delete Quiz" className="p-2!" />}
                    </div>

                    <button
                        onClick={toggleActions}
                        className={`md:hidden hover:cursor-pointer p-1 rounded-full transition-all duration-300 ${isActionsOpen ? 'text-failure hover:bg-failure/20' : 'hover:bg-primary/10 text-primary'}`}
                    >
                        {isActionsOpen ? <X size={20} strokeWidth={2.5} /> : <MoreVertical size={20} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>

            <DecidePopup />
        </div>
    );
};