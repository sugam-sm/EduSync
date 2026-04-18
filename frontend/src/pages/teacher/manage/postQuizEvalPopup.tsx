import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ClipboardCheck, Send, Loader2, User, Award, MessageCircle } from 'lucide-react';
import { Portal } from '../../../components/Portal';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { type AppDispatch, type RootState } from '../../../store';
import { fetchQuizStudentResults, fetchQuizRemarks, submitBulkRemarks, clearTeacherRemarkData } from '../../../features/learning/teacherRemarkSlice';
import { fetchUsers } from '../../../features/organization/userSlice';
import { addToast } from '../../../features/toasts/toastSlice';

interface PostQuizEvalPopupProps {
    isOpen: boolean;
    onClose: () => void;
    quizId: number;
    quizTitle: string;
    endDatetime: string | null | undefined;
}

export const PostQuizEvalPopup = ({ isOpen, onClose, quizId, quizTitle, endDatetime }: PostQuizEvalPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { studentResults, existingRemarks, isLoading, isSubmitting } = useSelector((state: RootState) => state.teacherRemark);
    const { users } = useSelector((state: RootState) => state.user);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const [remarkInputs, setRemarkInputs] = useState<Record<number, string>>({});

    useEffect(() => {
        if (isOpen && quizId) {
            dispatch(fetchQuizStudentResults(quizId));
            dispatch(fetchQuizRemarks({ quiz_id: quizId }));
            if (users.length === 0) {
                dispatch(fetchUsers());
            }
        }
        return () => {
            dispatch(clearTeacherRemarkData());
        };
    }, [isOpen, quizId, dispatch, users.length]);

    // Pre-fill existing remarks
    useEffect(() => {
        if (existingRemarks.length > 0) {
            const prefilled: Record<number, string> = {};
            existingRemarks.forEach(r => {
                prefilled[r.student] = r.remark_text;
            });
            setRemarkInputs(prev => ({ ...prefilled, ...prev }));
        }
    }, [existingRemarks]);

    const handleRemarkChange = (studentId: number, text: string) => {
        setRemarkInputs(prev => ({ ...prev, [studentId]: text }));
    };

    const filledCount = useMemo(() => {
        return Object.values(remarkInputs).filter(v => v.trim().length > 0).length;
    }, [remarkInputs]);

    const handleSubmitAll = async () => {
        const remarks = Object.entries(remarkInputs)
            .filter(([, text]) => text.trim().length > 0)
            .map(([studentId, remark_text]) => ({
                student_id: Number(studentId),
                remark_text: remark_text.trim()
            }));

        if (remarks.length === 0) {
            dispatch(addToast({ message: 'Enter at least one remark before submitting.', type: 'info' }));
            return;
        }

        const someChanged = remarks.some(r => {
            const existing = existingRemarks.find(er => er.student === r.student_id);
            return !existing || existing.remark_text !== r.remark_text;
        });
        
        const countsDiffer = remarks.length !== existingRemarks.length;

        if (!someChanged && !countsDiffer) {
            dispatch(addToast({ message: "No changes detected.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: `Submit ${remarks.length} remark(s) for this assessment?`,
            confirmText: "Yes, Submit",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(submitBulkRemarks({ quizId, remarks }));
                if (submitBulkRemarks.fulfilled.match(result)) {
                    dispatch(addToast({ message: `${remarks.length} remark(s) submitted successfully!`, type: 'success' }));
                    onClose();
                } else {
                    dispatch(addToast({ message: 'Failed to submit remarks. Try again.', type: 'failure' }));
                }
            }
        });
    };

    const handleClose = () => {
        setRemarkInputs({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <div className="w-full max-w-3xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center p-8 pb-4 border-b border-light/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/20 text-primary rounded-2xl shadow-lg shadow-primary/10">
                                <ClipboardCheck size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Post-Quiz Evaluation</h2>
                                <p className="text-xs font-bold text-text-muted tracking-wide">{quizTitle}</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Body - Scrollable student list */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="font-bold">Loading student results...</p>
                            </div>
                        ) : studentResults.length === 0 ? (
                            <div className="text-center py-20 text-text-muted">
                                <p className="font-bold text-lg">No quiz attempts found yet.</p>
                                <p className="text-sm mt-2">Students need to complete this quiz before you can evaluate.</p>
                            </div>
                        ) : (
                            studentResults.map((student) => (
                                <div
                                    key={student.student_id}
                                    className="bg-light/5 border-2 border-light/10 rounded-3xl p-5 space-y-3 hover:border-primary/20 transition-all duration-200"
                                >
                                    {/* Student info row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <User size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-heading text-sm">
                                                    {student.student_name}
                                                    {users.find(u => u.id === student.student_id)?.username && (
                                                        <span className="text-text-muted/60 font-medium ml-1">
                                                            | {users.find(u => u.id === student.student_id)?.username}
                                                        </span>
                                                    )}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {(() => {
                                                        const now = new Date();
                                                        const end = endDatetime ? new Date(endDatetime) : null;
                                                        const isClosed = end && now > end;
                                                        
                                                        const rawStatus = (student.status || 'not-started').toLowerCase();
                                                        
                                                        const statusLabels: Record<string, { label: string, color: string }> = {
                                                            'completed': { label: 'Completed', color: 'bg-success/10 text-success border-success/20' },
                                                            'auto-submitted': { label: 'Auto-Submitted', color: 'bg-info/10 text-info border-info/20' },
                                                            'submitted': { label: 'Submitted', color: 'bg-success/10 text-success border-success/20' },
                                                            'in-progress': { 
                                                                label: isClosed ? 'Missed / Timed Out' : 'In Progress', 
                                                                color: isClosed ? 'bg-failure/10 text-failure border-failure/20' : 'bg-primary/10 text-primary border-primary/20' 
                                                            },
                                                            'not-started': { 
                                                                label: isClosed ? 'Missed' : 'Not Started', 
                                                                color: isClosed ? 'bg-failure/10 text-failure border-failure/20' : 'bg-text-muted/10 text-text-muted border-text-muted/10' 
                                                            },
                                                            'missed': { label: 'Missed', color: 'bg-failure/10 text-failure border-failure/20' },
                                                            'pending': { 
                                                                label: isClosed ? 'Missed' : 'Pending', 
                                                                color: isClosed ? 'bg-failure/10 text-failure border-failure/20' : 'bg-text-muted/10 text-text-muted border-text-muted/10' 
                                                            }
                                                        };

                                                        const info = statusLabels[rawStatus] || { 
                                                            label: student.status || 'N/A', 
                                                            color: isClosed && rawStatus !== 'completed' ? 'bg-failure/10 text-failure border-failure/20' : 'bg-light/10 text-text-muted border-light/5' 
                                                        };

                                                        return (
                                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border-2 ${info.color}`}>
                                                                {info.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                                            <Award size={14} className="text-primary" />
                                            <span className="font-black text-primary text-sm tabular-nums">
                                                {student.total_score}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Remark textarea */}
                                    <div className="relative">
                                        <div className="absolute top-3 left-4 text-text-muted/40">
                                            <MessageCircle size={16} />
                                        </div>
                                        <textarea
                                            className="w-full bg-surface/80 border-2 border-light/10 rounded-2xl pl-10 pr-4 py-3 text-text-heading text-sm font-semibold outline-none focus:border-primary transition-all min-h-20 resize-none placeholder:text-text-muted/40"
                                            placeholder={`Write a remark for ${student.student_name.split(' ')[0]}...`}
                                            value={remarkInputs[student.student_id] || ''}
                                            onChange={(e) => handleRemarkChange(student.student_id, e.target.value)}
                                            maxLength={2000}
                                        />
                                        {(remarkInputs[student.student_id]?.length || 0) > 0 && (
                                            <span className="absolute bottom-3 right-4 text-[10px] font-bold text-text-muted/50">
                                                {remarkInputs[student.student_id]?.length}/2000
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {studentResults.length > 0 && (
                        <div className="p-8 pt-4 border-t border-light/5 flex flex-col sm:flex-row gap-4 items-center">
                            <p className="text-xs font-bold text-text-muted flex-1">
                                {filledCount} of {studentResults.length} remark(s) filled
                            </p>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button label="Cancel" onClick={handleClose} variant="failure" className="flex-1 sm:flex-none py-3.5 px-6 text-sm font-black uppercase tracking-widest" />
                                <FormButton
                                    isLoading={isSubmitting}
                                    onClick={handleSubmitAll}
                                    className="flex-2 sm:flex-none py-3.5 px-8 text-sm font-black uppercase tracking-widest"
                                >
                                    <Send size={16} className="mr-2" /> Submit All
                                </FormButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <DecidePopup />
        </Portal>
    );
};
