import React, { useState, useRef } from 'react';
import { X, FileUp, Loader2, Info, AlertTriangle, CheckCircle, Download, Users } from 'lucide-react';
import { Portal } from './Portal';
import { Button } from './Buttons/customButton';
import { FormButton } from './Buttons/formButton';
import { CustomDropdown } from './Custom/customDropdown';

interface SampleFile {
    label: string;
    headers: string[];
}

interface CsvUploadPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<any>;
    title: string;
    description: string;
    samples: SampleFile[];
    dropdownConfig?: {
        label: string;
        options: { label: string; value: string }[];
        value: string;
        onChange: (val: string) => void;
        icon?: any;
    };
}

export const CsvUploadPopup = ({ isOpen, onClose, onUpload, title, description, samples, dropdownConfig }: CsvUploadPopupProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [results, setResults] = useState<{ 
        detail: string; 
        errors?: string[]; 
        created_users?: any[] 
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        try {
            const res = await onUpload(file);
            setResults(res);
        } catch (error: any) {
            setResults({ 
                detail: error.detail || "Bulk upload failed", 
                errors: Array.isArray(error.errors) ? error.errors : undefined 
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResults(null);
        onClose();
    };

    const downloadSample = (sample: SampleFile) => {
        const csvContent = "data:text/csv;charset=utf-8," + sample.headers.join(",") + "\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${sample.label.toLowerCase().replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadCredentials = () => {
        if (!results?.created_users || results.created_users.length === 0) return;

        const headers = ["Username", "First Name", "Last Name", "Email", "Role", "Generated Password"];
        const rows = results.created_users.map(u => [
            u.username,
            u.first_name,
            u.last_name,
            u.email,
            u.role_name || (u.teacher_profile ? 'Teacher' : 'Student'),
            u.generated_password
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `credentials_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <div className="w-full max-w-lg bg-surface border-2 border-light/10 rounded-4xl shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="px-8 pt-8 pb-4 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-extrabold text-primary">{title}</h2>
                            <p className="text-text-muted text-sm mt-1">{description}</p>
                        </div>
                        <button onClick={handleClose} className="p-2 text-failure hover:bg-failure/20 hover:text-failure rounded-full transition-all duration-300 hover:cursor-pointer hover:rotate-90">
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="px-8 pb-8 overflow-y-auto">
                        {!results ? (
                            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                                {dropdownConfig && (
                                    <CustomDropdown
                                        label={dropdownConfig.label}
                                        options={dropdownConfig.options}
                                        value={dropdownConfig.value}
                                        onChange={dropdownConfig.onChange}
                                        icon={dropdownConfig.icon || Users}
                                        className="w-full"
                                    />
                                )}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-3 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${file ? 'border-primary/50 bg-primary/5' : 'border-light/10 hover:border-primary/30 hover:bg-light/5'}`}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept=".csv" 
                                        className="hidden" 
                                    />
                                    <div className={`p-4 rounded-full ${file ? 'bg-primary text-white' : 'bg-light/10 text-text-muted'}`}>
                                        <FileUp size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-text-heading">{file ? file.name : 'Select CSV File'}</p>
                                        <p className="text-xs text-text-muted mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Click to browse'}</p>
                                    </div>
                                </div>

                                <div className="bg-light/5 border border-light/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <Info size={16} strokeWidth={3}/>
                                        <h4 className="text-sm font-black uppercase tracking-widest">Download Structure File</h4>
                                    </div>
                                    <p className="text-sm text-text-muted font-medium mb-4 leading-relaxed">
                                        Download the template below, fill in each row with correct data following the column headers, then upload the completed file.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {samples.map((sample, idx) => (
                                            <button 
                                                key={idx}
                                                type="button" 
                                                onClick={() => downloadSample(sample)}
                                                className="flex items-center justify-between gap-2 p-3 bg-surface border border-light/10 rounded-xl hover:border-primary/50 transition-all hover:cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                        <Download size={14} />
                                                    </div>
                                                    <span className="text-sm font-bold text-text-heading">{sample.label}</span>
                                                </div>
                                                <span className="text-[10px] text-text-muted font-mono bg-light/5 px-2 py-0.5 rounded">.csv</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button label="Cancel" onClick={handleClose} variant="failure" className="flex-1 py-3" />
                                    <FormButton 
                                        type="submit" 
                                        variant="primary" 
                                        className="flex-2 py-3"
                                        disabled={!file || isUploading}
                                    >
                                        {isUploading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={18} className="animate-spin" />
                                                Processing...
                                            </div>
                                        ) : 'Upload & Import'}
                                    </FormButton>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6 mt-4 pb-4">
                                <div className={`p-6 rounded-3xl flex flex-col items-center gap-4 text-center ${results.errors?.length ? 'bg-failure/10 border-2 border-failure/20' : 'bg-success/10 border-2 border-success/20'}`}>
                                    {results.errors?.length ? <AlertTriangle size={48} className="text-failure" /> : <CheckCircle size={48} className="text-success" />}
                                    <div>
                                        <h3 className={`text-xl font-bold ${results.errors?.length ? 'text-failure' : 'text-success'}`}>
                                            {results.detail}
                                        </h3>
                                        {results.errors && results.errors.length > 0 && (
                                            <p className="text-text-muted text-sm mt-1 font-medium">Found {results.errors.length} issues during import</p>
                                        )}
                                    </div>
                                </div>

                                {results.created_users && results.created_users.length > 0 && (
                                    <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary text-white rounded-xl">
                                                    <Download size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-text-heading">Download Credentials</h4>
                                                    <p className="text-[10px] text-text-muted uppercase font-black tracking-wider">Required for user login</p>
                                                </div>
                                            </div>
                                            <Button 
                                                label="Download CSV" 
                                                onClick={downloadCredentials} 
                                                variant="primary" 
                                                className="px-4 py-2 text-xs"
                                            />
                                        </div>
                                    </div>
                                )}

                                {results.errors && results.errors.length > 0 && (
                                    <div className="bg-surface border-2 border-light/5 rounded-2xl overflow-hidden shadow-inner">
                                        <div className="bg-light/5 px-4 py-2 border-b border-light/10">
                                            <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Detailed Logs</p>
                                        </div>
                                        <div className="p-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {results.errors.map((err, i) => (
                                                <p key={i} className="text-sm text-text-muted font-mono bg-light/3 p-2 rounded-lg break-words border border-light/5">{err}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button label="Close" onClick={handleClose} variant="primary" className="w-full py-3" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    );
};
