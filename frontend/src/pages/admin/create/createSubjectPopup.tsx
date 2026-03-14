import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, BookOpen } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { createSubject } from '../../../features/organization/subjectSlice';
import { addToast } from '../../../features/toasts/toastSlice';

export const CreateSubjectPopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, subjects } = useSelector((state: RootState) => state.subject);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const [form, setForm] = useState({ name: '' });

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

        const isDuplicate = subjects.some(s => s.name.toLowerCase() === form.name.toLowerCase());
        if (isDuplicate) {
            dispatch(addToast({ message: "A subject with this name already exists.", type: 'failure' }));
            return;
        }

        openDecidePopup({
            question: `Create the subject "${form.name}"?`,
            confirmText: "Yes, Create",
            cancelText: "Cancel",
            variant: "secondary",
            onConfirm: async () => {
                const result = await dispatch(createSubject(form));
                if (createSubject.fulfilled.match(result)) {
                    handleClose();
                    dispatch(addToast({ message: 'Subject created successfully.', type: 'success' }));
                } else {
                    const errorMessage = (result.payload as any)?.name?.[0] || "Failed to create subject.";
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
                        <h2 className="text-xl font-bold text-primary">Add New Subject</h2>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-90 cursor-pointer">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-5">
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
                        Create Subject
                    </FormButton>
                </div>
            </form>
            <DecidePopup />
        </div>
    );
};