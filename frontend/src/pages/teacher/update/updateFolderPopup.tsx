import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { updateResourceFolder, resetResourceState, type ResourceFolder } from '../../../features/learning/resourceSlice';
import { Portal } from '../../../components/Portal';

interface UpdateFolderPopupProps {
    isOpen: boolean;
    onClose: () => void;
    folder: ResourceFolder | null;
}

export const UpdateFolderPopup = ({ isOpen, onClose, folder }: UpdateFolderPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, message } = useSelector((state: RootState) => state.resource);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const [folderName, setFolderName] = useState('');

    useEffect(() => {
        if (folder) {
            setFolderName(folder.name);
        }
    }, [folder]);

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
            dispatch(resetResourceState());
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = () => {
        if (folder) setFolderName(folder.name);
        onClose();
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!folder || !folder.id) return;

        if (!folderName.trim()) {
            dispatch(addToast({ message: "Folder name is required.", type: 'info' }));
            return;
        }

        if (folderName === folder.name) {
            dispatch(addToast({ message: "No changes detected.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: `Rename folder to "${folderName}"?`,
            confirmText: "Yes, Rename",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(updateResourceFolder({ 
                    folderId: folder.id!, 
                    folderData: { name: folderName } 
                }));

                if (updateResourceFolder.fulfilled.match(result)) {
                    dispatch(addToast({ message: 'Folder renamed successfully.', type: 'success' }));
                    onClose();
                }
            }
        });
    };

    if (!isOpen || !folder) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">Rename Folder</h2>
                                <p className="text-text-muted mt-1 font-medium">Update the name of your resource folder</p>
                            </div>
                            <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto md:overflow-y-visible flex-1">
                        <CustomInput 
                            label="New Folder Name" 
                            value={folderName} 
                            onChange={(e: any) => setFolderName(e.target.value)} 
                            placeholder="Enter new folder name"
                            roleColor="primary"
                        />
                    </div>

                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
                            Save Changes
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};