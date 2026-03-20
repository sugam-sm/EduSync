import { useState } from 'react';
import { X, File, FileArchive, Link, Download, ExternalLink, View } from "lucide-react";
import { Portal } from '../../../components/Portal';
import { Button } from '../../../components/Buttons/customButton';
import { type ResourceFolder } from '../../../features/learning/resourceSlice';

interface ViewResourcesPopupProps {
    isOpen: boolean;
    onClose: () => void;
    folder: ResourceFolder;
}

export const ViewResourcesPopup = ({ isOpen, onClose, folder }: ViewResourcesPopupProps) => {
    const [viewingResource, setViewingResource] = useState<any | null>(null);

    const isViewable = (filename: string | null | undefined): boolean => {
        if (!filename) return false;
        const viewableExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt'];
        return viewableExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };

    const isZipFile = (filename: string | null | undefined): boolean => {
        if (!filename) return false;
        return filename.toLowerCase().endsWith('.zip');
    };



    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                {viewingResource && (
                    <div className="fixed inset-0 z-50 bg-surface p-2 sm:p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-surface border-2 border-light/10 p-1 rounded-2xl">
                            <h3 className="ml-4 font-bold text-lg sm:text-xl text-primary truncate max-w-[70%]">
                                {viewingResource.title}
                            </h3>
                            <button 
                                onClick={() => setViewingResource(null)}
                                className="p-2 text-text-muted hover:text-failure hover:bg-failure/20 rounded-full transition-all duration-300 cursor-pointer hover:rotate-90"
                            >
                                <X size={23} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="flex-1 w-full bg-light/5 border-2 border-light/10 rounded-2xl overflow-hidden">
                            <iframe 
                                src={viewingResource.file} 
                                className="w-full h-full" 
                                title="Viewer"
                            />
                        </div>
                    </div>
                )}
                <div className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh] overflow-y-auto transform scale-100 opacity-100 transition-all">
                    <div className="px-8 pt-6 pb-2">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-extrabold text-primary">View Resources</h2>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                    <div className="px-8 pb-6 space-y-5 flex-1">
                        <div className="px-2">
                            <div className="p-1 rounded-2xl uppercase border border-light/10 text-center font-bold text-lg bg-primary/10 text-primary">
                                {folder.name}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2 ml-1">Current Resources</h3>
                            <div className="space-y-1.5 h-[40vh] overflow-y-auto border-2 border-dashed border-light/10 rounded-3xl p-2">
                                {folder.resources.length > 0 ? (
                                    folder.resources.map(res => (
                                        <div key={res.id} className="flex justify-between items-center p-2 bg-surface border border-light/10 rounded-2xl group hover:border-primary/50 transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                                    {res.type === 'LINK' ? <Link size={20} /> : isZipFile(res.file) ? <FileArchive size={20} /> : <File size={20} />}
                                                </div>
                                                <p className="font-bold text-text-heading truncate">{res.title}</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {res.type === 'LINK' ? (
                                                    <button 
                                                        onClick={() => res.url && window.open(res.url, '_blank')}
                                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/20 rounded-full transition-all duration-300 cursor-pointer"
                                                        title="Open Link"
                                                    >
                                                        <ExternalLink size={20} strokeWidth={3}/>
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        {isViewable(res.file) && (
                                                            <button 
                                                                onClick={() => setViewingResource(res)}
                                                                className="p-2 text-text-muted hover:text-primary hover:bg-primary/20 rounded-full transition-all duration-300 cursor-pointer"
                                                                title="View File"
                                                            >
                                                                <View size={20} strokeWidth={3}/>
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => {
                                                                if (res.file) {
                                                                    const link = document.createElement('a');
                                                                    link.href = res.file;
                                                                    link.target = "_blank";
                                                                    link.download = res.title || 'download';
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    document.body.removeChild(link);
                                                                }
                                                            }}
                                                            className="p-2 text-text-muted hover:text-primary hover:bg-primary/20 rounded-full transition-all duration-300 cursor-pointer"
                                                            title="Download File"
                                                        >
                                                            <Download size={20} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                                        <File size={48} strokeWidth={1.5} className="text-text-muted mb-2" />
                                        <p className="text-text-muted font-medium italic">No resources in this folder.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-8 pt-2">
                        <Button label="Close" onClick={onClose} variant='primary' className='w-full py-3.5 text-lg font-black uppercase tracking-widest' />
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default ViewResourcesPopup;
