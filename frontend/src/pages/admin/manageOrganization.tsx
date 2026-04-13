import React, { useState, useEffect } from 'react';
import { Camera, Building2, Mail, Pen,  Trash2} from 'lucide-react';
import { FormButton } from '../../components/Buttons/formButton';
import { Button } from '../../components/Buttons/customButton';

import { type AppDispatch, type RootState } from '../../store';
import { fetchOrganization, updateOrganization, resetOrgState } from '../../features/organization/organizationSlice'
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../features/toasts/toastSlice';

import { DecisionPopup } from '../../components/decision popup';

export const ManageOrganization = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { organization, isLoading, isSuccess, isError, message } = useSelector((state: RootState) => state.organization);

    const { openDecidePopup, DecidePopup } = DecisionPopup()

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        logo: null as File | null | 'delete'
    });

    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchOrganization());
    }, [dispatch]);

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name,
                email: organization.email,
                logo: null
            });
            setPreview(organization?.logo || null);
        }
    }, [organization]);

    useEffect(() => {
        if (isSuccess) {
            dispatch(addToast({
                message: 'Organization details updated successfully.',
                type: 'success'
            }));
            dispatch(resetOrgState());
        }
    }, [isSuccess, dispatch]);

    useEffect(() => {
        if (isError && message) {
            dispatch(addToast({
                message: message || "Check your internet connection or Try again later.",
                type: 'failure'
            }));
            dispatch(resetOrgState());
        }
    }, [isError, message, dispatch]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, logo: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveLogo = () => {
        setFormData({ ...formData, logo: 'delete' });
        setPreview(null);
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        const isNameChanged = formData.name !== organization?.name;
        const isEmailChanged = formData.email !== organization?.email;
        const isLogoChanged = formData.logo !== null;

        if (!isNameChanged && !isEmailChanged && !isLogoChanged) {
            dispatch(addToast({
                message: 'No changes detected to update.',
                type: 'info'
            }));
            return;
        }

        if (!formData.name.trim() || !formData.email.trim()) {
            dispatch(addToast({
                message: 'Name and email of the organization are required.',
                type: 'failure'
            }));
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            dispatch(addToast({
                message: 'Invalid email format.',
                type: 'info'
            }));
            return;
        }

        if (formData.logo instanceof File) {
            const allowedExtensions = ['image/png', 'image/jpeg', 'image/jpg'];
            const maxSize = 2 * 1024 * 1024;

            if (!allowedExtensions.includes(formData.logo.type)) {
                dispatch(addToast({
                    message: 'Invalid file type. Please upload a PNG, JPG, or JPEG image.',
                    type: 'failure'
                }));
                return;
            }

            if (formData.logo.size > maxSize) {
                dispatch(addToast({
                    message: 'File size too large. Logo must be less than 2MB.',
                    type: 'failure'
                }));
                return;
            }
        }

        openDecidePopup({
            question: "Are you sure you want to update the organization details?",
            confirmText: "Confirm Changes",
            cancelText: "Cancel",
            variant: "secondary",
            onConfirm: () => {
                const data = new FormData();
                data.append('name', formData.name);
                data.append('email', formData.email);
                
                if (formData.logo instanceof File) {
                    data.append('logo', formData.logo);
                } else if (formData.logo === 'delete') {
                    data.append('logo', ''); 
                }
                
                dispatch(updateOrganization(data));
            }
        });
    };

    return (
        <main className="flex flex-col justify-center w-full sm:w-[70%] xl:w-[50%] h-full mx-auto py-8 overflow-y-auto custom-scrollbar px-4 pt-10">
            
            <form onSubmit={handleSubmit} className="space-y-6 px-1 lg:px-2">

                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-text-heading text-sm ml-1">Organization Name</label>
                    <div className="relative group">
                        <Building2 
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors duration-500" 
                            size={18} 
                        />
                        <input 
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Enter organization name"
                            className="w-full p-3.5 pl-12 rounded-xl border-2 border-light/20 outline-none transition-all placeholder:text-text-muted bg-surface/30 text-text-heading focus:text-primary focus:border-primary duration-500 shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-text-heading text-sm ml-1">Organization Email</label>
                    <div className="relative group">
                        <Mail 
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors duration-500" 
                            size={18} 
                        />
                        <input 
                            type="text"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="org@example.com"
                            className="w-full p-3.5 pl-12 rounded-xl border-2 border-light/20 outline-none transition-all duration-500 placeholder:text-text-muted bg-surface/30 text-text-heading focus:text-primary focus:border-primary shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-text-heading text-sm ml-1">Organization Logo</label>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-3 border-dashed border-light/30 flex items-center justify-center overflow-hidden bg-bg relative group shadow-inner">
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-cover animate-in zoom-in-95 duration-500" />
                            ) : (
                                <Camera className="text-text-muted group-hover:text-primary transition-colors duration-500" size={32} />
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-3 w-full sm:w-auto">
                            <p className="text-[10px] text-text-muted text-center sm:text-left uppercase font-bold tracking-wider opacity-60">PNG, JPG, JPEG up to 2MB</p>
                            
                            <div className="flex flex-col gap-2">
                                <input 
                                    type="file" 
                                    id="logo-upload"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    label={preview ? 'Change' : 'Select'}
                                    Icon={Pen}
                                    variant="primary"
                                    className=""
                                />
                                
                                {preview && (
                                    <Button
                                        onClick={() => openDecidePopup({
                                            question: "Are you sure you want to remove the logo?",
                                            confirmText: "Remove Logo",
                                            cancelText: "Cancel",
                                            variant: "primary",
                                            onConfirm: handleRemoveLogo
                                        })}
                                        label="Remove"
                                        Icon={Trash2}
                                        variant="failure"
                                        className=""
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="pt-2">
                    <FormButton 
                        type="submit" 
                        isLoading={isLoading} 
                        className="w-full py-4 text-base shadow-lg shadow-primary/10"
                    >
                        Update Details
                    </FormButton>
                </div>
                
            </form>
            <DecidePopup />
        </main>
    );
};