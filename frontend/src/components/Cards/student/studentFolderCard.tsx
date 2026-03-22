import { useState, useRef } from 'react';
import { Folder, FolderOpen, MoreVertical, X, Paperclip } from "lucide-react";
import { type ResourceFolder } from "../../../features/learning/resourceSlice";
import { ActionButton } from '../../Buttons/actionButton';

interface StudentFolderCardProps {
    folder: ResourceFolder;
    onView: (folder: ResourceFolder) => void;
}

export const StudentFolderCard = ({ folder, onView }: StudentFolderCardProps) => {
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom');
    const cardRef = useRef<HTMLDivElement>(null);

    const fileCount = folder.resources?.filter(r => r.type === 'FILE').length || 0;
    const linkCount = folder.resources?.filter(r => r.type === 'LINK').length || 0;
    const resourceCount = fileCount + linkCount;

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

    return (
        <div ref={cardRef} className={`relative w-full bg-surface border-2 border-light/10 rounded-xl p-2 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50 ${isActionsOpen ? 'z-20' : 'z-0'}`}>

            {isActionsOpen && (
                <div className={`md:hidden absolute right-2 z-20 bg-surface border border-light/20 p-2 rounded-xl shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 ${menuPosition === 'bottom' ? 'top-[80%]' : 'bottom-[80%]'}`}>
                    <ActionButton Icon={FolderOpen} variant='custom' onClick={() => { onView(folder); setIsActionsOpen(false); }} title="Open Folder" className="p-2!" />
                </div>
            )}

            <div className="flex justify-between items-center w-full overflow-hidden">
                <div className="flex items-center gap-4 w-full min-w-0">
                    <div className="hidden md:block p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Folder size={24} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-bold text-lg text-primary truncate" title={folder.name}>
                            {folder.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary/70">
                            <Paperclip size={12} className="shrink-0" />
                            <span className="truncate">{resourceCount} Resources</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <div className="hidden md:flex gap-1">
                        <ActionButton Icon={FolderOpen} variant='custom' onClick={() => onView(folder)} title="Open Folder" className="p-2!" />
                    </div>

                    <button
                        onClick={toggleActions}
                        className={`md:hidden hover:cursor-pointer p-1 rounded-full transition-all duration-300 ${isActionsOpen ? 'text-failure hover:bg-failure/20' : 'hover:bg-primary/10 text-primary'}`}
                    >
                        {isActionsOpen ? <X size={20} strokeWidth={2.5} /> : <MoreVertical size={20} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
