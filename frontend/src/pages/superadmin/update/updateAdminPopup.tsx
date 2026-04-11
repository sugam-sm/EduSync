import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../../../store';
import { addToast } from '../../../features/toasts/toastSlice';
import { fetchOrganizations } from '../../../features/organization/organizationSlice';
import api from '../../../api';
import { Shield, Building2, UserCircle, ArrowLeft, Mail, Fingerprint, Zap, Loader2, Save } from 'lucide-react';
import { CustomInput } from '../../../components/Custom/customInput';
import { CustomDropdown } from '../../../components/Custom/customDropdown';
import { Button } from '../../../components/Buttons/customButton';

export const UpdateAdminPopup = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    
    const { organizations } = useSelector((state: RootState) => state.organization);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        role_name: '',
        organization: '',
        is_active: true,
        is_superuser: false,
    });

    useEffect(() => {
        dispatch(fetchOrganizations());
        const fetchUser = async () => {
            try {
                const res = await api.get(`/api/users/${id}/`);
                const data = res.data;
                setFormData({
                    username: data.username,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    role_name: data.role_name || '',
                    organization: data.organization,
                    is_active: data.is_active,
                    is_superuser: data.is_superuser
                });
            } catch (error) {
                dispatch(addToast({message: "Failed to fetch user details", type: "failure"}));
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [id, dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/api/users/${id}/`, formData);
            dispatch(addToast({message: "User updated successfully", type: "success"}));
            navigate('/superadmin/manage/users');
        } catch (error) {
            dispatch(addToast({message: "Failed to update user", type: "failure"}));
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
                    <UserCircle size={14} /> Identity Modification
                </div>
                <h1 className="text-3xl font-bold text-text-heading tracking-tight">
                    Update <span className="text-primary">Identity</span>
                </h1>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-40 mt-1">Ref ID: {id}</div>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-surface p-10 rounded-2xl border-2 border-light/10 shadow-sm relative overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                        <CustomInput 
                            label="Username"
                            icon={Fingerprint}
                            required 
                            type="text" 
                            name="username" 
                            value={formData.username} 
                            onChange={handleChange} 
                        />
                    </div>
                    <div className="space-y-4">
                        <CustomInput 
                            label="Email Address"
                            icon={Mail}
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                        <CustomInput 
                            label="First Name"
                            type="text" 
                            name="first_name" 
                            value={formData.first_name} 
                            onChange={handleChange} 
                        />
                    </div>
                    <div className="space-y-4">
                        <CustomInput 
                            label="Last Name"
                            type="text" 
                            name="last_name" 
                            value={formData.last_name} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                        <CustomDropdown 
                            label="Security Role"
                            options={[
                                { label: 'Admin', value: 'admin' },
                                { label: 'Teacher', value: 'teacher' },
                                { label: 'Student', value: 'student' },
                            ]}
                            icon={Shield}
                            value={formData.role_name}
                            onChange={(val: any) => setFormData(p => ({ ...p, role_name: val }))}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-4">
                        <CustomDropdown 
                            label="Organization Mapping"
                            options={organizations.map(o => ({ label: o.name, value: o.id }))}
                            icon={Building2}
                            value={formData.organization}
                            onChange={(val: any) => setFormData(p => ({ ...p, organization: val }))}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 py-8 border-t border-light/5">
                    <label className="flex items-center gap-3 cursor-pointer group/check">
                         <div className="relative flex items-center justify-center">
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="peer appearance-none w-6 h-6 rounded-lg border-2 border-light/20 bg-bg checked:bg-success checked:border-success transition-all cursor-pointer" />
                            <div className="absolute opacity-0 peer-checked:opacity-100 text-bg pointer-events-none transition-opacity">
                                <Zap size={14} strokeWidth={4} />
                            </div>
                        </div>
                        <span className="text-text-heading font-bold uppercase tracking-wider text-[10px] group-hover/check:text-success transition-colors">Authorization Active</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group/check">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" name="is_superuser" checked={formData.is_superuser} onChange={handleChange} className="peer appearance-none w-6 h-6 rounded-lg border-2 border-light/20 bg-bg checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                            <div className="absolute opacity-0 peer-checked:opacity-100 text-bg pointer-events-none transition-opacity">
                                <Shield size={14} strokeWidth={4} />
                            </div>
                        </div>
                        <span className="text-text-heading font-bold uppercase tracking-wider text-[10px] group-hover/check:text-primary transition-colors">SuperAdmin Authority</span>
                    </label>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-10">
                    <Button 
                        label="Discard Modifications" 
                        variant="secondary"
                        onClick={() => navigate('/superadmin/manage/users')} 
                        className="flex-1 py-3.5! uppercase tracking-wider text-xs"
                    />
                    <button 
                        type="submit" 
                        className="flex-[1.5] bg-primary text-text-heading py-3.5 rounded-2xl hover:bg-primary/80 transition-all font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:cursor-pointer border-2 border-primary/20"
                    >
                        <Save size={18} />
                        Update Identity Record
                    </button>
                </div>
            </form>
        </div>
    );
};
