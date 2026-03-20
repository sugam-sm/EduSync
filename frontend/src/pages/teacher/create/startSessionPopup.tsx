import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, PlayCircle, BookOpen } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { startSession } from '../../../features/analytics/attendanceSlice';
import { fetchAssignSubs } from '../../../features/organization/assignSubjectSlice';
import { Portal } from '../../../components/Portal';

interface StartSessionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    gradeId: string | number;
}

export const StartSessionPopup = ({ isOpen, onClose, gradeId }: StartSessionPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.attendance);
    const { assignSub } = useSelector((state: RootState) => state.assignsub);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchAssignSubs());
        }
    }, [dispatch, isOpen]);

    const assignment = assignSub.find(a => String(a.grade) === String(gradeId));
    const subjectId = assignment?.subject;
    const subjectName = assignment?.subject_name || "Unknown Subject";

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!subjectId) {
            dispatch(addToast({ message: "No subject assigned for this grade.", type: 'failure' }));
            return;
        }

        openDecidePopup({
            question: `Start a new physical session for "${subjectName}"?`,
            confirmText: "Yes, Start",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(startSession({ 
                    grade: Number(gradeId), 
                    subject: Number(subjectId) 
                })); 

                if (startSession.fulfilled.match(result)) {
                    dispatch(addToast({ message: 'Session started successfully.', type: 'success' }));
                    onClose();
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <PlayCircle size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-extrabold text-primary">Start New Session</h2>
                                    <p className="text-text-muted mt-1 font-medium">Begin tracking attendance for today</p>
                                </div>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto md:overflow-y-visible flex-1">
                        <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                                <BookOpen size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="block text-xs font-black text-primary uppercase tracking-widest mb-1">Subject</span>
                                <span className="block text-xl font-bold text-text-heading truncate capitalize">
                                    {subjectName}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-text-muted px-1 italic font-medium">
                            A live session will be created for <span className="text-primary font-bold">{subjectName}</span>. You can then mark student attendance in real-time.
                        </p>
                    </div>

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={onClose} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
                            Start Session
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};
