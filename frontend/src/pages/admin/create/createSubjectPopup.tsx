import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { createSubject } from '../../../features/organization/subjectSlice';
import { addToast } from '../../../features/toasts/toastSlice';
import { Portal } from '../../../components/Portal';

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
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <form onSubmit={handleValidation} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">New Subject</h2>
                                <p className="text-text-muted mt-1 font-medium">Please enter the details to register a new subject</p>
                            </div>
                            <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 flex-1">
                        <CustomInput 
                            label="Subject Name" 
                            value={form.name} 
                            onChange={(e: any) => setForm({...form, name: e.target.value})} 
                            placeholder="e.g. Mathematics"
                            roleColor="primary"
                        />
                    </div>

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
                            Create Subject
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};