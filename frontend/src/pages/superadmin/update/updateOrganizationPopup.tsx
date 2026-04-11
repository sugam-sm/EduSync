import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { type AppDispatch } from '../../../store';
import { addToast } from '../../../features/toasts/toastSlice';
import api from '../../../api';
import { Building2, Mail, CloudUpload, ArrowLeft, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { CustomInput } from '../../../components/Custom/customInput';
import { Button } from '../../../components/Buttons/customButton';

export const UpdateOrganizationPopup = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        is_active: true,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const res = await api.get(`/api/organizations/list/${id}/`);
                setFormData({
                    name: res.data.name,
                    email: res.data.email,
                    is_active: res.data.is_active
                });
            } catch (error) {
                dispatch(addToast({message: "Failed to fetch organization details", type: "failure"}));
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrg();
    }, [id, dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            dispatch(addToast({ message: "Invalid email format.", type: 'info' }));
            return;
        }

        try {
            await api.patch(`/api/organizations/list/${id}/`, formData);
            dispatch(addToast({message: "Organization updated successfully", type: "success"}));
            navigate('/superadmin/manage/organizations');
        } catch (error) {
            dispatch(addToast({message: "Failed to update organization", type: "failure"}));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-40 gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="font-bold text-primary uppercase tracking-widest text-xs">Loading Details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pt-8 font-sans text-text-body pb-24 transition-all duration-300">
            <button 
                onClick={() => navigate(-1)} 
                className="group flex items-center gap-2 text-text-muted mb-8 hover:text-primary transition-all font-bold text-xs uppercase tracking-wider"
            >
                <div className="w-8 h-8 rounded-lg bg-surface border-2 border-light/10 flex items-center justify-center group-hover:border-primary/40 transition-all">
                    <ArrowLeft size={16} />
                </div>
                Back to Registry
            </button>
            
            <div className="mb-10">
                <div className="text-primary font-bold uppercase tracking-wider text-xs mb-1 flex items-center gap-2 border-b-2 border-primary/20 pb-1 w-fit">
                    <Building2 size={14} /> Organization Modification
                </div>
                <h1 className="text-3xl font-bold text-text-heading tracking-tight">
                    Update <span className="text-primary">Organization</span>
                </h1>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-40 mt-1">Ref ID: {id}</div>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-surface p-10 rounded-2xl border-2 border-light/10 shadow-sm relative overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                        <CustomInput 
                            label="Organization Name"
                            icon={Building2}
                            required 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-4">
                        <CustomInput 
                            label="Admin Email"
                            icon={Mail}
                            required 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-text-muted font-bold uppercase tracking-wider text-[10px] opacity-70">
                            <ShieldCheck size={14} className="text-success" /> Activation Status
                        </label>
                        <label className="flex items-center gap-4 cursor-pointer p-5 bg-bg/40 rounded-xl border-2 border-light/5 hover:border-success/30 transition-all group/check">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="peer appearance-none w-6 h-6 rounded-lg border-2 border-light/20 bg-surface checked:bg-success checked:border-success transition-all cursor-pointer"
                                />
                                <div className="absolute opacity-0 peer-checked:opacity-100 text-bg pointer-events-none transition-opacity">
                                    <Zap size={14} strokeWidth={4} />
                                </div>
                            </div>
                            <div>
                                <div className="text-text-heading font-bold text-base group-hover/check:text-success transition-colors">Authorization Status</div>
                                <div className="text-text-muted font-bold text-[10px] uppercase tracking-wider opacity-40">Active registry node status</div>
                            </div>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-text-muted font-bold uppercase tracking-wider text-[10px] opacity-70">
                            <CloudUpload size={14} className="text-primary" /> Replace Logo
                        </label>
                        <div className="w-full h-24 border-2 border-dashed border-light/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-primary/5 hover:border-primary/40 cursor-pointer transition-all group/upload bg-bg/30">
                            <CloudUpload className="text-text-muted opacity-40 group-hover/upload:text-primary transition-all" size={24} />
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider opacity-40 group-hover/upload:text-primary transition-all">Update Identifier Asset</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-12">
                    <Button 
                        label="Discard Modifications" 
                        variant="secondary"
                        onClick={() => navigate('/superadmin/manage/organizations')} 
                        className="flex-1 py-3.5! uppercase tracking-wider text-xs"
                    />
                    <button 
                        type="submit" 
                        className="flex-[1.5] bg-primary text-text-heading py-3.5 rounded-2xl hover:bg-primary/80 transition-all font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:cursor-pointer border-2 border-primary/20"
                    >
                        <Zap size={18} />
                        Update Registry Record
                    </button>
                </div>
            </form>
        </div>
    );
};
