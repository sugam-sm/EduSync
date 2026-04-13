import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Mail, UserRound, Copy, Check, KeyRound, Lock } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { addToast } from '../../../features/toasts/toastSlice';
import { createUser, updateUser, fetchUsers } from '../../../features/organization/userSlice';
import { Portal } from '../../../components/Portal';
import { CustomDropdown } from '../../../components/Custom/customDropdown';

interface CreateAdminPopupProps {
    isOpen: boolean;
    onClose: () => void;
    editUser?: any;
    roleDefault?: 'admin' | 'teacher' | 'student';
}

export const CreateAdminPopup = ({ isOpen, onClose, editUser, roleDefault }: CreateAdminPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isError, message } = useSelector((state: RootState) => state.user);
    const { organizations } = useSelector((state: RootState) => state.organization);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [organizationId, setOrganizationId] = useState<string | number>("");
    const [gender, setGender] = useState<string>("");
    const [isActive, setIsActive] = useState(true);
    const [newPassword, setNewPassword] = useState("");
    const [showResetPassword, setShowResetPassword] = useState(false);

    // Generated credentials state
    const [generatedCreds, setGeneratedCreds] = useState<{ username: string; password: string } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setGeneratedCreds(null);
            if (editUser) {
                setFirstName(editUser.first_name || "");
                setMiddleName(editUser.middle_name || "");
                setLastName(editUser.last_name || "");
                setEmail(editUser.email || "");
                setOrganizationId(editUser.organization || "");
                setGender(editUser.gender || "");
                setIsActive(editUser.is_active !== false);
            } else {
                setFirstName("");
                setMiddleName("");
                setLastName("");
                setEmail("");
                setOrganizationId("");
                setGender("");
                setIsActive(true);
            }
            setNewPassword("");
            setShowResetPassword(false);
        }
    }, [editUser, isOpen]);

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = (force = false) => {
        if (generatedCreds) {
            onClose();
            return;
        }

        const hasChanges = editUser
            ? (firstName !== editUser.first_name || lastName !== editUser.last_name || email !== editUser.email)
            : (firstName || lastName || email);

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

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const confirmSubmit = async (data: any) => {
        try {
            if (editUser) {
                await dispatch(updateUser({ userId: editUser.id, userData: data })).unwrap();
                dispatch(addToast({ message: "Admin updated successfully", type: 'success' }));
                dispatch(fetchUsers());
                onClose();
            } else {
                const result = await dispatch(createUser(data)).unwrap();
                setGeneratedCreds({
                    username: result.username,
                    password: result.generated_password
                });
                dispatch(fetchUsers());
            }
        } catch (error: any) {
            // Toast managed by useEffect
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim()) {
            dispatch(addToast({ message: "First Name is required.", type: 'info' }));
            return;
        }

        if (!lastName.trim()) {
            dispatch(addToast({ message: "Last Name is required.", type: 'info' }));
            return;
        }

        if (!organizationId) {
            dispatch(addToast({ message: "Please select an organization.", type: 'info' }));
            return;
        }

        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            dispatch(addToast({ message: "Invalid email format.", type: 'info' }));
            return;
        }

        if (editUser && showResetPassword && newPassword.trim()) {
            if (newPassword.length < 6) {
                dispatch(addToast({ message: "New password must be at least 6 characters.", type: 'info' }));
                return;
            }
        }

        const data = {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            email,
            organization: organizationId,
            role_name: roleDefault || 'admin',
            gender: gender,
            is_active: isActive,
        } as any;

        if (editUser && showResetPassword && newPassword.trim()) {
            data.password = newPassword;
        }

        openDecidePopup({
            question: editUser ? `Update Administrator "${firstName} ${lastName}"?` : `Create Administrator "${firstName} ${lastName}"?`,
            confirmText: editUser ? "Yes, Update" : "Yes, Create",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: () => confirmSubmit(data)
        });
    };

    if (!isOpen) return null;

    // Show generated credentials screen
    if (generatedCreds) {
        return (
            <Portal>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col">
                        <div className="px-8 pt-8 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-success">Admin Created!</h2>
                                    <p className="text-text-muted mt-1 font-medium text-sm">
                                        Save these credentials — the password cannot be retrieved later.
                                    </p>
                                </div>
                                <button type="button" onClick={() => handleClose()} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                    <X size={24} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        <div className="px-8 pb-8 space-y-4">
                            <div className="bg-light/5 border-2 border-light/10 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Username</p>
                                        <p className="text-lg font-bold text-text-heading mt-0.5">{generatedCreds.username}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(generatedCreds.username, 'username')}
                                        className="p-2 hover:bg-primary/20 rounded-xl text-text-muted hover:text-primary transition-all cursor-pointer"
                                    >
                                        {copiedField === 'username' ? <Check size={18} strokeWidth={3} className="text-success" /> : <Copy size={18} strokeWidth={2.5} />}
                                    </button>
                                </div>
                                <div className="border-t border-light/10" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Password</p>
                                        <p className="text-lg font-bold text-text-heading mt-0.5 font-mono">{generatedCreds.password}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(generatedCreds.password, 'password')}
                                        className="p-2 hover:bg-primary/20 rounded-xl text-text-muted hover:text-primary transition-all cursor-pointer"
                                    >
                                        {copiedField === 'password' ? <Check size={18} strokeWidth={3} className="text-success" /> : <Copy size={18} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>

                            <Button label="Done" onClick={() => handleClose()} variant='primary' className='w-full py-3' />
                        </div>
                    </div>
                </div>
            </Portal>
        );
    }

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
                                    {editUser ? 'Update Admin' : 'New Admin'}
                                </h2>
                                <p className="text-text-muted mt-1 font-medium">
                                    {editUser ? `Updating Profile: ${editUser.username}` : 'Credentials will be auto-generated. * means required.'}
                                </p>
                            </div>
                            <button type="button" onClick={() => handleClose()} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6 overflow-y-auto md:overflow-y-visible flex-1">
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1">Personal Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <CustomInput
                                    label="First Name *"
                                    value={firstName}
                                    onChange={(e: any) => setFirstName(e.target.value)}
                                    placeholder="First name"
                                    icon={UserRound}
                                />
                                <CustomInput
                                    label="Middle Name"
                                    value={middleName}
                                    onChange={(e: any) => setMiddleName(e.target.value)}
                                    placeholder="Middle name"
                                    icon={UserRound}
                                />
                                <CustomInput
                                    label="Last Name *"
                                    value={lastName}
                                    onChange={(e: any) => setLastName(e.target.value)}
                                    placeholder="Last name"
                                    icon={UserRound}
                                />
                            </div>
                            <CustomInput
                                label="Email Address *"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                placeholder="admin@domain.com"
                                icon={Mail}
                                autoComplete="new-password"
                            />
                        </div>

                        {editUser && (
                            <div className="space-y-4 pt-4 border-t border-light/5">
                                <button
                                    type="button"
                                    onClick={() => { setShowResetPassword(!showResetPassword); setNewPassword(""); }}
                                    className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1 hover:text-primary transition-colors cursor-pointer"
                                >
                                    <KeyRound size={14} strokeWidth={3} />
                                    {showResetPassword ? 'Cancel Password Reset' : 'Reset Password'}
                                </button>
                                {showResetPassword && (
                                    <CustomInput
                                        type="password"
                                        label="New Password"
                                        value={newPassword}
                                        onChange={(e: any) => setNewPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        icon={Lock}
                                        autoComplete="new-password"
                                    />
                                )}
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-light/5">
                            <h3 className="text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1">Assignment</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <CustomDropdown
                                    label="Organization *"
                                    className="w-full"
                                    options={[
                                        { label: 'Select Organization...', value: '' },
                                        ...organizations.map((org: any) => ({ label: org.name, value: org.id }))
                                    ]}
                                    value={organizationId}
                                    onChange={(val: any) => setOrganizationId(val)}
                                />
                                <CustomDropdown
                                    label="Gender *"
                                    className="w-full"
                                    options={[
                                        { label: 'Select Gender...', value: '' },
                                        { label: 'Male', value: 'Male' },
                                        { label: 'Female', value: 'Female' },
                                        { label: 'Other', value: 'Other' },
                                    ]}
                                    value={gender}
                                    onChange={(val: any) => setGender(val)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-4">
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
                            {editUser ? 'Update Admin' : 'Create Admin'}
                        </FormButton>
                    </div>
                </form>

                <DecidePopup />
            </div>
        </Portal>
    );
};
