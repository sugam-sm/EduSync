import { useState, useRef } from 'react';
import { Edit2, Settings2, Clock, HelpCircle, MoreVertical, X, Trash2, ClipboardCheck } from "lucide-react";
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

    const getStatusInfo = () => {
        if (!quiz.is_published) return { label: 'Draft', color: 'bg-text-muted/10 text-text-muted border-text-muted/40' };

        const now = new Date();
        const start = quiz.start_datetime ? new Date(quiz.start_datetime) : null;
        const end = quiz.end_datetime ? new Date(quiz.end_datetime) : null;

        if (start && now < start) return { label: 'Scheduled', color: 'bg-info/10 text-info border-info/40' };
        if (start && end && now >= start && now <= end) return { label: 'Live', color: 'bg-success/10 text-success border-success/40' };
        if (end && now > end) return { label: 'Closed', color: 'bg-failure/10 text-failure border-failure/40' };

        return { label: 'Published', color: 'bg-primary/10 text-primary border-primary/40' };
    };

    const status = getStatusInfo();
    const isEditable = !quiz.is_published;

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

    const isClosed = quiz.is_published && (!quiz.end_datetime || new Date() > new Date(quiz.end_datetime));

    return (
        <div ref={cardRef} className={`relative w-full bg-surface border-2 border-light/10 rounded-xl p-2 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50 ${isActionsOpen ? 'z-20' : 'z-0'}`}>

            {isActionsOpen && (
                <div className={`md:hidden absolute right-2 z-20 bg-surface border border-light/20 p-2 rounded-xl shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 ${menuPosition === 'bottom' ? 'top-[80%]' : 'bottom-[80%]'}`}>
                    {onEdit && <ActionButton Icon={Edit2} variant='custom' onClick={() => { onEdit(quiz); setIsActionsOpen(false); }} title="Quiz Settings" className="p-2!" />}
                    {onModify && <ActionButton Icon={Settings2} variant='custom' onClick={() => { onModify(quiz); setIsActionsOpen(false); }} title={isEditable ? "Manage Questions" : "View Questions"} className="p-2!" />}
                    {onEdit && <ActionButton Icon={Trash2} variant='failure' onClick={() => { handleDelete(); setIsActionsOpen(false); }} title="Delete Quiz" className="p-2!" />}
                </div>
            )}

            <div className="flex justify-between items-center w-full overflow-hidden">
                <div className="flex items-center gap-4 w-full min-w-0">
                    <div className="hidden md:block p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <HelpCircle size={24} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2 py-1">
                        <h3 className="font-bold text-lg text-primary truncate leading-none" title={quiz.title}>
                            {quiz.title}
                        </h3>
                        <div className="flex items-center flex-wrap gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className={`relative flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${status.color}`}>
                                    {status.label}
                                </span>
                                {quiz.is_ai_generated && (
                                    <span className="bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                                        AI
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-primary/70">
                                <Clock size={12} className="shrink-0" />
                                <span className="truncate">{quiz.default_time_per_question || 60}s Per Question</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {onEvaluate && isClosed && <div className="md:hidden"><ActionButton Icon={ClipboardCheck} variant='custom' onClick={() => onEvaluate(quiz)} title="Evaluation & Remarks" className="p-2!" /></div>}
                    <div className="hidden md:flex gap-1">
                        {onEdit && <ActionButton Icon={Edit2} variant='custom' onClick={() => onEdit(quiz)} title="Quiz Settings" className="p-2!" />}
                        {onModify && <ActionButton Icon={Settings2} variant='custom' onClick={() => onModify(quiz)} title={isEditable ? "Manage Questions" : "View Questions"} className="p-2!" />}
                        {onEvaluate && isClosed && <ActionButton Icon={ClipboardCheck} variant='custom' onClick={() => onEvaluate(quiz)} title="Evaluation & Remarks" className="p-2!" />}
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