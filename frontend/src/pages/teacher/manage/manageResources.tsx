import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, File, FileArchive, Link, Download, ExternalLink, Upload, View } from "lucide-react";

import { Button } from '../../../components/Buttons/customButton';
import { FormButton } from '../../../components/Buttons/formButton';
import { DecisionPopup } from '../../../components/decision popup';
import { Portal } from '../../../components/Portal';
import { CustomInput } from '../../../components/Custom/customInput';

import { type AppDispatch, type RootState } from '../../../store';
import { createResource, deleteResource, type ResourceFolder } from '../../../features/learning/resourceSlice';
import { addToast } from '../../../features/toasts/toastSlice';

interface ManageResourcesProps {
    isOpen: boolean;
    onClose: () => void;
    folder: ResourceFolder;
}

export const ManageResources = ({ isOpen, onClose, folder }: ManageResourcesProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewingResource, setViewingResource] = useState<any | null>(null);
    
    const currentFolder = useSelector((state: RootState) => 
        state.resource.folders.find(f => f.id === folder.id)
    ) || folder;

    const { isResourceLoading } = useSelector((state: RootState) => state.resource);
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'FILE' | 'LINK'>('FILE');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');

    const isViewable = (filename: string | null | undefined): boolean => {
        if (!filename) return false;
        const viewableExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt'];
        return viewableExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };

    const isZipFile = (filename: string | null | undefined): boolean => {
        if (!filename) return false;
        return filename.toLowerCase().endsWith('.zip');
    };

    const performAddResource = async () => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        formData.append('folder', currentFolder.id!.toString());
        
        if (type === 'FILE' && file) formData.append('file', file);
        if (type === 'LINK') formData.append('url', url);

        const result = await dispatch(createResource(formData));
        if (createResource.fulfilled.match(result)) {
            dispatch(addToast({ message: "Resource added successfully!", type: 'success' }));
            setTitle(''); setUrl(''); setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            dispatch(addToast({ message: "Resource title is required.", type: 'info' }));
            return;
        }

        if (type === 'FILE' && !file) {
            dispatch(addToast({ message: "Please select a file.", type: 'info' }));
            return;
        }

        if (type === 'LINK' && !url.trim()) {
            dispatch(addToast({ message: "URL is required.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: "Are you sure you want to add this resource?",
            confirmText: "Confirm Add",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: performAddResource
        });
    };

    const handleDelete = (id: number) => {
        openDecidePopup({
            question: "Remove this resource?",
            confirmText: "Remove",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(deleteResource(id));
                if (deleteResource.fulfilled.match(result)) {
                    dispatch(addToast({ message: "Resource removed", type: 'success' }));
                }
            }
        });
    };

    const handleAction = (res: any) => {
        if (res.type === 'FILE' && res.file) {
            if (isViewable(res.file)) {
                setViewingResource(res);
            } else {
                window.location.href = res.file;
            }
        } else if (res.url) {
            window.open(res.url, '_blank');
        }
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
                <div className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh] overflow-y-auto">
                    <div className="px-8 pt-6 pb-2">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-extrabold text-primary h-full">Manage Resources</h2>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                    <div className="px-8 pb-0 space-y-5 flex-1">
                        <div className="px-2">
                            <div className="p-1 rounded-2xl uppercase border border-light/10 text-center font-bold text-lg bg-primary/10 text-primary">
                                {currentFolder.name}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Current Resources</h3>
                            <div className="space-y-2 h-[28.5vh] md:h-[30vh] overflow-y-auto border-2 border-dashed border-light/10 rounded-3xl p-1.5">
                                {currentFolder.resources.length > 0 ? (
                                    currentFolder.resources.map(res => (
                                        <div key={res.id} className="flex justify-between items-center p-1 bg-light/5 border border-light/10 rounded-2xl group hover:border-primary/50 transition-all">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary border border-light/10 shrink-0">
                                                    {res.type === 'LINK' ? <Link size={20} /> : isZipFile(res.file) ? <FileArchive size={20} /> : <File size={20} />}
                                                </div>
                                                <p className="font-bold text-text-heading truncate">{res.title}</p>
                                            </div>
                                            <div className="flex items-center gap-0 shrink-0">
                                                <button 
                                                    onClick={() => handleAction(res)}
                                                    className="p-1.5 md:p-2 text-text-muted hover:text-primary hover:bg-primary/20 rounded-full transition-all duration-300 cursor-pointer"
                                                >
                                                    {res.type === 'LINK' ? <ExternalLink size={20} strokeWidth={3}/> : res.type === 'FILE' && res.file && isViewable(res.file) ? <View size={20} strokeWidth={3}/> : <Download size={20} strokeWidth={3} />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(res.id!)}
                                                    className="p-1.5 md:p-2 text-text-muted hover:text-failure hover:bg-failure/20 rounded-full transition-all duration-300 cursor-pointer hover:rotate-90"
                                                >
                                                    <X size={20} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center py-10">
                                        <p className="text-text-muted font-medium italic">No resources in this folder.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">Add New Resource</h3>
                            <form onSubmit={handleSubmit} className="mb-4">
                                <div className="grid grid-cols-1 gap-4 items-end">
                                    <CustomInput 
                                        label="Resource Title"
                                        placeholder="Enter title" 
                                        value={title}
                                        onChange={(e: any) => setTitle(e.target.value)}
                                        roleColor="primary"
                                    />
                                    <div className="flex gap-2 p-1 bg-light/5 rounded-xl border-2 border-light/10 h-10 items-center w-full mb-2">
                                        <button type="button" onClick={() => setType('FILE')} className={`flex-1 px-5 py-1 rounded-lg font-bold transition-all hover:cursor-pointer ${type === 'FILE' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>File</button>
                                        <button type="button" onClick={() => setType('LINK')} className={`flex-1 px-6 py-1 rounded-lg font-bold transition-all hover:cursor-pointer ${type === 'LINK' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Link</button>
                                    </div>
                                </div>
                                {type === 'FILE' ? (
                                <div className="space-y-2">
                                    <span className="text-[11px] uppercase ml-1 font-bold text-text-muted">Select File</span> 
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className="w-full h-11 flex items-center justify-between px-4 bg-light/5 rounded-xl border-2 border-light/10 text-text-muted hover:border-primary/50 transition-all cursor-pointer"
                                    >
                                        <span className="truncate">{file ? file.name : "Click to Select file"}</span>
                                        <Upload size={18} className="shrink-0 ml-2" />
                                    </button>
                                </div>
                            ) : (
                                <CustomInput
                                    label="Resource URL" 
                                    placeholder="https://www.example.com" 
                                    value={url} 
                                    onChange={(e: any) => setUrl(e.target.value)} 
                                    roleColor="primary" 
                                />
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                                className="hidden" 
                            />
                            </form>
                        </div>
                    </div>
                    <div className="p-6 flex gap-4 pt-0 bg-transparent">
                        <Button label="Close" onClick={onClose} variant='failure' className='flex-1 py-3' />
                        <FormButton onClick={handleSubmit} isLoading={isResourceLoading} variant='primary' className='flex-2 py-3'>
                            Add Resource
                        </FormButton>
                    </div>
                </div>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default ManageResources;