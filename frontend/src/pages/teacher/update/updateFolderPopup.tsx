import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, FolderPen } from "lucide-react";
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-2">
                    <div className="flex justify-between items-center p-3 border-2 border-light/10 bg-surface rounded-3xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                <FolderPen size={24} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-bold text-primary">Rename Folder</h2>
                        </div>
                        <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-180 cursor-pointer">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="rounded-3xl p-5 space-y-5">
                        <CustomInput 
                            label="New Folder Name" 
                            value={folderName} 
                            onChange={(e: any) => setFolderName(e.target.value)} 
                            placeholder="Enter new folder name"
                            roleColor="primary"
                        />
                    </div>

                    <div className="p-2 border-2 rounded-3xl border-light/10 flex gap-3 bg-light/5">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2'>
                            Save Changes
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};