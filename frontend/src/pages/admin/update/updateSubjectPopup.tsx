import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, BookOpen } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { updateSubject } from '../../../features/management/subjectSlice';
import { addToast } from '../../../features/toasts/toastSlice';

export const UpdateSubjectPopup = ({ isOpen, onClose, subject }: { isOpen: boolean; onClose: () => void; subject: any }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, subjects } = useSelector((state: RootState) => state.subject);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const [form, setForm] = useState({ name: '' });

    useEffect(() => {
        if (isOpen && subject) {
            setForm({ name: subject.name });
        }
    }, [isOpen, subject]);

    const handleClose = () => {
        setForm({ name: '' });
        onClose();
    };

    const handleValidation = (e: React.SyntheticEvent) => {
        e.preventDefault();
        
        if (!form.name.trim()) {
            dispatch(addToast({ message: "Subject name is required.", type: 'info' }));
            return;
        }

        if (form.name.trim() === subject.name.trim()) {
            dispatch(addToast({ message: "No changes detected to update.", type: 'info' }));
            return;
        }

        const isDuplicate = subjects.some(s => 
            s.id !== subject.id && s.name.toLowerCase() === form.name.toLowerCase()
        );
        
        if (isDuplicate) {
            dispatch(addToast({ message: "A subject with this name already exists.", type: 'failure' }));
            return;
        }

        openDecidePopup({
            question: `Update subject from "${subject.name}" to "${form.name}"?`,
            confirmText: "Yes, Update",
            cancelText: "Cancel",
            variant: "secondary",
            onConfirm: async () => {
                const result = await dispatch(updateSubject({ subjectId: subject.id, subjectData: form }));
                if (updateSubject.fulfilled.match(result)) {
                    handleClose();
                    dispatch(addToast({ message: 'Subject updated successfully.', type: 'success' }));
                } else {
                    const errorMessage = (result.payload as any)?.name?.[0] || "Failed to update subject.";
                    dispatch(addToast({ message: errorMessage, type: 'failure' }));
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
            <form onSubmit={handleValidation} className="w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 border-2 border-light/10 bg-surface rounded-3xl m-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                            <BookOpen size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-bold text-primary">Update Subject</h2>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-90 cursor-pointer">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-8">
                    <CustomInput 
                        label="Subject Name" 
                        value={form.name} 
                        onChange={(e: any) => setForm({...form, name: e.target.value})} 
                        placeholder="e.g. Mathematics"
                        roleColor="primary"
                    />
                </div>

                <div className="p-2 border-2 rounded-3xl border-light/5 flex gap-3 bg-light/5 m-4">
                    <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1' />
                    <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2'>
                        Update Subject
                    </FormButton>
                </div>
            </form>
            <DecidePopup />
        </div>
    );
};