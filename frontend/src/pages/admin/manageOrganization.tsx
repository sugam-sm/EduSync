import React, { useState, useEffect } from 'react';
import { Camera, Building2, Mail, Pen,  Trash2} from 'lucide-react';
import { FormButton } from '../../components/Buttons/formButton';

import { type AppDispatch, type RootState } from '../../store';
import { fetchOrganization, updateOrganization, resetOrgState } from '../../features/management/organizationSlice'
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
            setPreview(organization.logo);
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
        <main className="flex flex-col justify-center w-[85vw] lg:w-full min-h-[85vh] h-full mx-auto">
            <h1 className="text-2xl font-bold text-primary mb-4 text-center border-2 p-4 border-light/30 rounded-2xl">Organization Details</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6 p-2">

                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-text-heading">Organization Name</label>
                    <div className="relative group">
                        <Building2 
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors duration-500" 
                            size={20} 
                        />
                        <input 
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Enter organization name"
                            className="w-full lg:min-w-sm p-3 pl-12 rounded-xl border-2 border-light/20 outline-none transition-all placeholder:text-text-muted bg-transparent text-text-heading focus:text-primary focus:border-primary duration-500"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-text-heading">Organization Email</label>
                    <div className="relative group">
                        <Mail 
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors duration-500" 
                            size={20} 
                        />
                        <input 
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="org@example.com"
                            className="w-full p-3 pl-12 rounded-xl border-2 border-light/20 outline-none transition-all duration-500 placeholder:text-text-muted bg-transparent text-text-heading focus:text-primary focus:border-primary"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-text-heading">Organization Logo</label>
                    <div className="flex items-center gap-4">
                        <div className="md:w-50 md:h-50 w-30 h-30 rounded-full border-2 border-dashed border-light/30 flex items-center justify-center overflow-hidden bg-bg relative group">
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="text-text-muted group-hover:text-primary transition-colors duration-500" size={32} />
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-text-muted">PNG, JPG, JPEG up to 2MB</p>
                                
                                <label className="cursor-pointer bg-primary/30 text-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all flex justify-center items-center gap-2">
                                    <Pen size={15} strokeWidth={3}/>
                                    {preview ? 'Change Logo' : 'Select Logo'}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                
                                {preview && (
                                    <button 
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="bg-failure/30 text-failure px-10 py-2 rounded-full text-sm font-bold hover:bg-failure hover:text-white transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        <Trash2 size={15} strokeWidth={3}/>
                                        Remove
                                    </button>
                                )}
                            </div>
                            
                        </div>
                    </div>
                </div>
                
                <FormButton 
                    type="submit" 
                    isLoading={isLoading} 
                    className="w-full"
                >
                    Update
                </FormButton>
                
            </form>
            <DecidePopup />
        </main>
    );
};