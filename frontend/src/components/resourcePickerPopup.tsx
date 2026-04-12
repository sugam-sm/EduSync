import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Search, Upload, CheckCircle2, ChevronRight, FolderClosed, FileIcon, Loader2 } from 'lucide-react';
import { type RootState, type AppDispatch } from '../store';
import { fetchResourceFolders, type Resource } from '../features/learning/resourceSlice';
import { Portal } from './Portal';
import { Button } from './Buttons/customButton';
import { addToast } from '../features/toasts/toastSlice';

interface ResourcePickerPopupProps {
    isOpen: boolean;
    onClose: () => void;
    gradeId: string | number;
    onFileSelect: (file: File | Resource) => void;
}

export const ResourcePickerPopup = ({ isOpen, onClose, gradeId, onFileSelect }: ResourcePickerPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { folders, isLoading } = useSelector((state: RootState) => state.resource);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

    useEffect(() => {
        if (isOpen && gradeId) {
            dispatch(fetchResourceFolders({ grade: gradeId }));
        }
    }, [isOpen, gradeId, dispatch]);

    const handleSelect = (resource: Resource) => {
        setSelectedResourceId(resource.id!);
        setSelectedResource(resource);
    };

    const handleConfirm = () => {
        if (selectedResource) {
            onFileSelect(selectedResource);
            onClose();
        }
    };

    const handleUploadNew = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                const isImage = file.type.startsWith('image/');
                const isPdf = file.type === 'application/pdf';
                
                if (!isImage && !isPdf) {
                    dispatch(addToast({
                        message: "Only images and PDFs are supported for AI generation.",
                        type: 'failure'
                    }));
                    return;
                }
                onFileSelect(file);
                onClose();
            }
        };
        input.click();
    };

    if (!isOpen) return null;

    // Filter resources across folders: Only Image or PDF
    const allFileResources = folders.flatMap(folder => 
        folder.resources.filter(r => r.type === 'FILE')
    ).filter(r => {
        const title = r.title.toLowerCase();
        const file = r.file?.toLowerCase() || '';
        
        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(title) || /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/i.test(file);
        const isPdf = title.endsWith('.pdf') || file.includes('.pdf');
        
        return isImage || isPdf;
    }).filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Portal>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-md">
                <div className="w-full max-w-2xl bg-surface border-2 border-light/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-300">
                    
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-light/5">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Select Source Material</h2>
                                <p className="text-text-muted text-xs font-bold uppercase tracking-widest opacity-70">Choose an existing resource or upload a new one</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all">
                                <X size={20} strokeWidth={3}/>
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-50" size={18} />
                            <input 
                                type="text"
                                placeholder="Search your resources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-light/5 border-2 border-light/10 rounded-xl py-2 pl-10 pr-4 outline-none text-text-muted font-semibold focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="text-text-muted font-bold uppercase tracking-widest text-xs animate-pulse">Scanning Archive...</p>
                            </div>
                        ) : allFileResources.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="p-4 bg-light/5 rounded-full text-text-muted">
                                    <FolderClosed size={48} />
                                </div>
                                <div>
                                    <p className="font-black text-primary uppercase tracking-wider">No Resources Found</p>
                                    <p className="text-text-muted text-sm font-medium">You haven't uploaded any files for this grade yet.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {allFileResources.map((resource) => (
                                    <button 
                                        key={resource.id}
                                        onClick={() => handleSelect(resource)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                                            selectedResourceId === resource.id 
                                            ? "border-primary bg-primary/10" 
                                            : "border-light/5 bg-light/5 hover:border-primary/30 hover:bg-light/10"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${selectedResourceId === resource.id ? "bg-primary text-white" : "bg-light/10 text-text-muted group-hover:text-primary"}`}>
                                                <FileIcon size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-bold transition-colors ${selectedResourceId === resource.id ? "text-primary" : "text-text-muted group-hover:text-text-heading"}`}>
                                                    {resource.title}
                                                </p>
                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                                                    Added: {new Date(resource.uploaded_at!).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedResourceId === resource.id ? (
                                            <CheckCircle2 size={24} className="text-primary animate-in zoom-in" />
                                        ) : (
                                            <ChevronRight size={20} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-light/5 flex flex-col sm:flex-row gap-3">
                        <Button 
                            label="Choose from Explorer" 
                            variant="secondary" 
                            Icon={Upload} 
                            onClick={handleUploadNew}
                            className="flex-1"
                        />
                        <button 
                            disabled={!selectedResource}
                            onClick={handleConfirm}
                            className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                                selectedResource 
                                ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]" 
                                : "bg-text-muted/20 text-text-muted cursor-not-allowed"
                            }`}
                        >
                            <CheckCircle2 size={16} /> Use Selected File
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
