import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { createResourceFolder, resetResourceState } from '../../../features/learning/resourceSlice';
import { Portal } from '../../../components/Portal';

interface CreateFolderPopupProps {
    isOpen: boolean;
    onClose: () => void;
    grade: string | number;
    subject: string | number;
}

export const CreateFolderPopup = ({ isOpen, onClose, grade, subject }: CreateFolderPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, message } = useSelector((state: RootState) => state.resource);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const [folderName, setFolderName] = useState('');

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetResourceState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = () => {
        setFolderName('');
        onClose();
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!grade || grade === 'All') {
            dispatch(addToast({ message: "You have not selected any grade.", type: 'failure' }));
            return;
        }

        if (!subject || subject === 'All') {
            dispatch(addToast({ message: "You have not selected any subject.", type: 'failure' }));
            return;
        }

        if (!folderName.trim()) {
            dispatch(addToast({ message: "Folder name is required.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: `Create resource folder "${folderName}"?`,
            confirmText: "Yes, Create",
            cancelText: "Cancel",
            variant: "secondary",
            onConfirm: async () => {
                const result = await dispatch(createResourceFolder({ 
                    name: folderName, 
                    grade: grade as number,
                    subject: subject as number
                } as any)); 

                if (createResourceFolder.fulfilled.match(result)) {
                    dispatch(addToast({ message: 'Folder created successfully.', type: 'success' }));
                    handleClose();
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
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">New Resource Folder</h2>
                                <p className="text-text-muted mt-1 font-medium">Create a new folder for your resources</p>
                            </div>
                            <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto md:overflow-y-visible flex-1">
                        <CustomInput 
                            label="Folder Name" 
                            value={folderName} 
                            onChange={(e: any) => setFolderName(e.target.value)} 
                            placeholder="e.g. Unit 1: Introduction"
                            roleColor="primary"
                        />
                        <p className="text-sm text-text-muted px-1 italic">
                            This folder will be created for the currently selected grade.
                        </p>
                    </div>

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
                            Create Folder
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};
