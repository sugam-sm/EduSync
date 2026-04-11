import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Building2, Mail } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { createOrganization, updateOrganizationById, fetchOrganizations } from '../../../features/organization/organizationSlice';
import { Portal } from '../../../components/Portal';

interface CreateOrganizationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    editOrg?: any; // If provided, we are in update mode
}

export const CreateOrganizationPopup = ({ isOpen, onClose, editOrg }: CreateOrganizationPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isError, message } = useSelector((state: RootState) => state.organization);
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (editOrg) {
            setName(editOrg.name || "");
            setEmail(editOrg.email || "");
            setIsActive(editOrg.is_active !== false);
        } else {
            setName("");
            setEmail("");
            setIsActive(true);
        }
    }, [editOrg, isOpen]);

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = (force = false) => {
        const hasChanges = editOrg 
            ? (name !== editOrg.name || email !== editOrg.email)
            : (name || email);

        if (!force && hasChanges) {
            openDecidePopup({
                question: "Discard your changes?",
                confirmText: "Yes, Discard",
                cancelText: "Keep Editing",
                variant: "primary",
                onConfirm: () => handleClose(true)
            });
            return;
        }
        onClose();
    };

    const confirmSubmit = async (data: any) => {
        try {
            if (editOrg) {
                await dispatch(updateOrganizationById({
                    id: editOrg.id,
                    data
                })).unwrap();
                dispatch(addToast({ message: "Organization updated successfully", type: 'success' }));
            } else {
                await dispatch(createOrganization(data)).unwrap();
                dispatch(addToast({ message: "Organization created successfully", type: 'success' }));
            }
            dispatch(fetchOrganizations());
            onClose();
        } catch (error: any) {
            // Error managed by useEffect toast
        }
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        
        if (!name.trim() || !email.trim()) {
            dispatch(addToast({ message: "Name and Email are required.", type: 'info' }));
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            dispatch(addToast({ message: "Invalid email format.", type: 'info' }));
            return;
        }

        const data = { name, email, is_active: isActive };

        openDecidePopup({
            question: editOrg ? `Update Organization "${name}"?` : `Create Organization "${name}"?`,
            confirmText: editOrg ? "Yes, Update" : "Yes, Create",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: () => confirmSubmit(data)
        });
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                
                <form 
                    onSubmit={handleSubmit}
                    className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">
                                    {editOrg ? 'Update Organization' : 'New Organization'}
                                </h2>
                                <p className="text-text-muted mt-1 font-medium">
                                    {editOrg ? `Updating ${editOrg.name}` : 'Please enter the details to register'}
                                </p>
                            </div>
                            <button type="button" onClick={() => handleClose()} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3}/>
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-5 overflow-y-auto md:overflow-y-visible flex-1">
                        <div className="space-y-4 pt-2">
                            <h3 className="text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1">Organization Details</h3>
                            <CustomInput 
                                label="Organization Name" 
                                value={name} 
                                onChange={(e: any) => setName(e.target.value)} 
                                placeholder="e.g. Neo Tokyo Institute"
                                Icon={Building2}
                            />
                            <CustomInput 
                                label="Email Address" 
                                value={email} 
                                onChange={(e: any) => setEmail(e.target.value)} 
                                placeholder="contact@domain.com"
                                Icon={Mail}
                            />
                        </div>



                        <div className="flex items-center gap-4 py-4 pt-6">
                            <label className="text-xs font-black text-text-muted uppercase tracking-wider">Status:</label>
                            <button type="button" onClick={() => setIsActive(!isActive)}
                                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${isActive ? "bg-success/50" : "bg-text-muted/20"}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isActive ? "translate-x-6" : "translate-x-0"}`} />
                            </button>
                            <span className={`font-black text-[10px] uppercase tracking-widest ${isActive ? "text-success" : "text-text-muted"}`}>
                                {isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                        <Button label="Cancel" onClick={() => handleClose()} variant='failure' className='flex-1 py-3' />
                        <FormButton 
                            type="submit"
                            variant='primary' 
                            className='flex-2 py-3'
                        >
                            {editOrg ? 'Update Organization' : 'Create Organization'}
                        </FormButton>
                    </div>
                </form>
                
                <DecidePopup />
            </div>
        </Portal>
    );
};
