import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, User as UserIcon, Mail, Shield, Lock } from "lucide-react";
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
    const { roles } = useSelector((state: RootState) => state.role);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [organizationId, setOrganizationId] = useState<string | number>("");
    const [roleId, setRoleId] = useState<string | number>("");
    const [gender, setGender] = useState<string>("");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (isOpen) {
            if (editUser) {
                setUsername(editUser.username || "");
                setFullName(editUser.fullname || "");
                setEmail(editUser.email || "");
                setOrganizationId(editUser.organization || "");
                setRoleId(editUser.role || "");
                setGender(editUser.gender || "");
                setIsActive(editUser.is_active !== false);
                setPassword(""); // Don't show password on edit
            } else {
                setUsername("");
                setFullName("");
                setEmail("");
                setPassword("");
                setOrganizationId("");
                setRoleId("");
                setGender("");
                setIsActive(true);
            }
        }
    }, [editUser, isOpen]);

    useEffect(() => {
        if (isOpen && !editUser && roleDefault && roles.length > 0) {
            const foundRole = roles.find((r: any) => r.role_name.toLowerCase() === roleDefault.toLowerCase());
            if (foundRole) setRoleId(foundRole.id);
        }
    }, [isOpen, editUser, roleDefault, roles]);

    useEffect(() => {
        if (isError && message && isOpen) {
            dispatch(addToast({ message: message, type: 'failure' }));
        }
    }, [isError, message, dispatch, isOpen]);

    const handleClose = (force = false) => {
        const hasChanges = editUser
            ? (username !== editUser.username || fullName !== editUser.fullname)
            : (username || fullName || email);

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
            if (editUser) {
                await dispatch(updateUser({ userId: editUser.id, userData: data })).unwrap();
                dispatch(addToast({ message: "Identity updated successfully", type: 'success' }));
            } else {
                await dispatch(createUser(data)).unwrap();
                dispatch(addToast({ message: "Identity provisioned successfully", type: 'success' }));
            }
            dispatch(fetchUsers());
            onClose();
        } catch (error: any) {
            // Toast managed by useEffect
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || (!editUser && !password.trim())) {
            dispatch(addToast({ message: "Full Name and Password are required.", type: 'info' }));
            return;
        }

        if (!organizationId) {
            dispatch(addToast({ message: "Please select an organization.", type: 'info' }));
            return;
        }

        // Validate email if present
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            dispatch(addToast({ message: "Invalid email format.", type: 'info' }));
            return;
        }

        // Split fullname into first, middle, last
        const nameParts = fullName.trim().split(/\s+/);
        let first_name = "";
        let middle_name = "";
        let last_name = "";

        if (nameParts.length === 1) {
            first_name = nameParts[0];
        } else if (nameParts.length === 2) {
            first_name = nameParts[0];
            last_name = nameParts[1];
        } else {
            first_name = nameParts[0];
            last_name = nameParts[nameParts.length - 1];
            middle_name = nameParts.slice(1, -1).join(" ");
        }

        const data = {
            username,
            first_name,
            middle_name,
            last_name,
            email,
            organization: organizationId,
            role: roleId,
            gender: gender,
            is_active: isActive,
        } as any;

        if (password) data.password = password;

        openDecidePopup({
            question: editUser ? `Update Administrator "${fullName}"?` : `Create Administrator "${fullName}"?`,
            confirmText: editUser ? "Yes, Update" : "Yes, Create",
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
                                    {editUser ? 'Update Admin' : 'New Admin'}
                                </h2>
                                <p className="text-text-muted mt-1 font-medium">
                                    {editUser ? `Updating Profile: ${editUser.username}` : 'Please enter the details to register'}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <CustomInput
                                    label="Username"
                                    value={username}
                                    readOnly={true}
                                    onChange={(e: any) => setUsername(e.target.value)}
                                    placeholder="auto-generated"
                                    Icon={UserIcon}
                                />
                                <CustomInput
                                    label="Full Name"
                                    value={fullName}
                                    onChange={(e: any) => setFullName(e.target.value)}
                                    placeholder="John Wick"
                                    Icon={Shield}
                                />
                            </div>
                            <CustomInput
                                label="Email Address"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                placeholder="john@continental.com"
                                Icon={Mail}
                                autoComplete="new-password"
                            />
                            {!editUser && (
                                <CustomInput
                                    type="password"
                                    label="Password"
                                    value={password}
                                    onChange={(e: any) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    Icon={Lock}
                                    autoComplete="new-password"
                                />
                            )}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-light/5">
                            <h3 className="text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1">Roles & Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <CustomDropdown
                                    label="Organization"
                                    options={[
                                        { label: 'Select Domain...', value: '' },
                                        ...organizations.map((org: any) => ({ label: org.name, value: org.id }))
                                    ]}
                                    value={organizationId}
                                    onChange={(val: any) => setOrganizationId(val)}
                                />
                                {(!roleDefault || roleDefault !== 'admin') && (
                                    <CustomDropdown
                                        label="Role"
                                        options={[
                                            { label: 'Select Role...', value: '' },
                                            ...roles.map((r: any) => ({ label: r.role_name, value: r.id }))
                                        ]}
                                        value={roleId}
                                        onChange={(val: any) => setRoleId(val)}
                                    />
                                )}
                                <CustomDropdown
                                    label="Gender"
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
