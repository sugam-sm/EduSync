import { Folder, FolderPen, FolderCog, Trash2, Paperclip } from "lucide-react";
import { type ResourceFolder, deleteResourceFolder } from "../../features/learning/resourceSlice";
import { useDispatch } from "react-redux";
import { type AppDispatch } from "../../store";
import { addToast } from "../../features/toasts/toastSlice";
import { ActionButton } from '../Buttons/actionButton';
import { DecisionPopup } from '../decision popup';

interface ResourceFolderCardProps {
    folder: ResourceFolder;
    onEdit: (folder: ResourceFolder) => void;
    onModify: (folder: ResourceFolder) => void;
}

export const ResourceFolderCard = ({ folder, onEdit, onModify }: ResourceFolderCardProps) => {
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const dispatch = useDispatch<AppDispatch>();

    const fileCount = folder.resources?.filter(r => r.type === 'FILE').length || 0;
    const linkCount = folder.resources?.filter(r => r.type === 'LINK').length || 0;
    const resourceCount = fileCount + linkCount;

    const handleDelete = () => {
        openDecidePopup({
            question: `Permanently delete folder '${folder.name}'?`,
            confirmText: "Yes, Delete",
            cancelText: "Cancel",
            variant: 'primary',
            onConfirm: async () => {
                const resultAction = await dispatch(deleteResourceFolder(folder.id!));
        
                if (deleteResourceFolder.fulfilled.match(resultAction)) {
                    dispatch(addToast({
                        message: `Folder '${folder.name}' deleted successfully`,
                        type: 'success'
                    }));
                }
            }
        });
    };

    return (
        <div className="w-full bg-surface border-3 border-light/10 rounded-xl p-3 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50">
            
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Folder size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold sm:text-lg text-primary " title={folder.name}>
                        {folder.name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <Paperclip size={15} className="text-primary" />
                            <span className="text-primary">{resourceCount} Resources</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 lg:gap-0 justify-between">
                <ActionButton
                    label='Rename'
                    Icon={FolderPen}
                    variant='custom'
                    onClick={() => onEdit(folder)}
                />
                <ActionButton
                    label='Manage'
                    Icon={FolderCog}
                    variant='custom'
                    onClick={() => onModify(folder)}
                />
                <ActionButton
                    label='Delete'
                    Icon={Trash2}
                    variant='failure'
                    onClick={handleDelete}
                />
            </div>
            <DecidePopup />
        </div>
    );
};