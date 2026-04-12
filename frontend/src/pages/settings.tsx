import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {User, Mail, Shield, Building, Calendar, Loader2, Save, GraduationCap, Phone, Award, BookOpen, Users, UserCircle, BadgeInfo, KeyRound, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { type AppDispatch } from '../store';
import { addToast } from '../features/toasts/toastSlice';
import { verifyUserToken } from '../features/login/loginSlice';
import { FormButton } from '../components/Buttons/formButton';
import { BackToTop } from '../components/Custom/backToTop';
import { CustomInput } from '../components/Custom/customInput';
import { DecisionPopup } from '../components/decision popup';

interface ProfileData {
    id: number;
    username: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    full_name: string;
    email: string;
    gender: string;
    role: string;
    org_name: string | null;
    date_joined: string;
    needs_password_change: boolean;
    teacher_profile?: {
        contact_number: string;
        specialization: string;
        qualification: string;
    };
    student_profile?: {
        grade_name: string;
        section: string;
        academic_year: string;
        guardian_name: string;
        guardian_relation: string;
        guardian_contact: string;
    };
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-center gap-4 py-3.5 px-4 rounded-xl hover:bg-light/5 transition-colors group">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Icon size={16} className="text-primary" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm uppercase tracking-widest font-bold text-text-muted mb-0.5">{label}</p>
            <p className="text-text-heading font-semibold text-sm truncate">{value || '—'}</p>
        </div>
    </div>
);

const SectionCard = ({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-surface border-2 border-light/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b-2 border-light/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <Icon size={18} className="text-primary" strokeWidth={3} />
            </div>
            <div>
                <h3 className="text-text-heading font-bold text-md">{title}</h3>
                <p className="text-text-muted text-xs font-medium">{subtitle}</p>
            </div>
        </div>
        <div className="p-4">
            {children}
        </div>
    </div>
);

export const Settings = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const [activeSection, setActiveSection] = useState<'profile' | 'security'>('profile');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const res = await api.get('/api/profile/');
                setProfile(res.data);
                setEmail(res.data.email || '');
                setGender(res.data.gender || '');
            } catch {
                setError('Failed to load profile data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile?.needs_password_change) {
            dispatch(addToast({ message: "For your security, you must change your temporary password before accessing other features.", type: 'failure' }));
            setActiveSection('security');
        }
    }, [profile?.needs_password_change, dispatch]);

    const confirmSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const res = await api.patch('/api/profile/', { email, gender });
            setProfile(res.data);
            dispatch(addToast({ message: 'Profile updated successfully.', type: 'success' }));
        } catch (err: any) {
            const msg = err.response?.data?.email || err.response?.data?.gender || 'Failed to update profile.';
            dispatch(addToast({ message: msg, type: 'failure' }));
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!hasProfileChanges) {
            dispatch(addToast({ message: 'No changes detected to update.', type: 'info' }));
            return;
        }

        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            dispatch(addToast({ message: "Invalid email format.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: "Are you sure you want to update your profile details?",
            confirmText: "Yes, Update",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: confirmSaveProfile
        });
    };

    const handleChangePassword = async () => {
        if (!oldPassword.trim()) {
            dispatch(addToast({ message: 'Enter your current password.', type: 'failure' }));
            return;
        }
        if (!newPassword.trim()) {
            dispatch(addToast({ message: 'Enter your new password.', type: 'failure' }));
            return;
        }
        if (newPassword.length < 6) {
            dispatch(addToast({ message: 'New password must be at least 6 characters.', type: 'failure' }));
            return;
        }
        if (newPassword !== confirmPassword) {
            dispatch(addToast({ message: 'Passwords do not match.', type: 'failure' }));
            return;
        }

        openDecidePopup({
            question: "Are you sure you want to change your password?",
            confirmText: "Yes, Change Password",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                setIsSavingPassword(true);
                try {
                    await api.patch('/api/profile/', { 
                        old_password: oldPassword, 
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    });
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    dispatch(addToast({ message: 'Password changed successfully.', type: 'success' }));
                    dispatch(verifyUserToken());
                } catch (err: any) {
                    const msg = err.response?.data?.old_password || err.response?.data?.new_password || 'Failed to change password.';
                    dispatch(addToast({ message: msg, type: 'failure' }));
                } finally {
                    setIsSavingPassword(false);
                }
            }
        });
    };

    const hasProfileChanges = profile && (email !== (profile.email || '') || gender !== (profile.gender || ''));

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="font-bold tracking-widest uppercase text-xs">Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                <h3 className="text-2xl font-bold text-failure">Error Loading Profile</h3>
                <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center align-middle h-full w-full relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">
                    Settings
                </h1>
            </div>

            {/* Content */}
            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                {/* Tab navigation (mobile) */}
                <div className="flex gap-2 mb-4 lg:hidden">
                    <button
                        onClick={() => setActiveSection('profile')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                            activeSection === 'profile'
                                ? 'bg-primary/15 text-primary border-primary/30'
                                : 'bg-surface text-text-muted border-light/10 hover:border-primary/20'
                        }`}
                    >
                        <UserCircle size={16} className="inline mr-1.5 -mt-0.5" />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveSection('security')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                            activeSection === 'security'
                                ? 'bg-primary/15 text-primary border-primary/30'
                                : 'bg-surface text-text-muted border-light/10 hover:border-primary/20'
                        }`}
                    >
                        <KeyRound size={16} className="inline mr-1.5 -mt-0.5" />
                        Security
                    </button>
                </div>

                <div className="relative mx-auto h-[62.7vh] lg:h-[70vh]">
                    <div
                        className="sm:p-5 p-2 bg-surface border-2 border-light/3 rounded-2xl h-full overflow-auto"
                        ref={scrollRef}
                    >
                        <div className="p-4 sm:p-6 lg:p-8 pb-20">
                            {/* ── Profile Header Banner ── */}
                            <div className="bg-primary/20 border-2 border-primary/15 rounded-2xl p-6 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 pointer-events-none text-primary opacity-25">
                                    <User size={120} />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center shrink-0">
                                        <span className="text-2xl font-bold text-primary">
                                            {profile.first_name?.[0]?.toUpperCase() || profile.username[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-2xl font-bold text-text-heading truncate">{profile.full_name || profile.username}</h2>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-primary/20">
                                                {roleLabel}
                                            </span>
                                            {profile.org_name && (
                                                <>
                                                    <span className="text-text-muted text-sm">•</span>
                                                    <span className="text-text-muted text-sm font-semibold truncate">{profile.org_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* ── LEFT COLUMN: Profile info ── */}
                                <div className={`flex flex-col gap-5 ${activeSection !== 'profile' ? 'hidden lg:flex' : ''}`}>
                                    {/* Account Information */}
                                    <SectionCard title="Account Information" subtitle="Your core identity details" icon={BadgeInfo}>
                                        <div className="space-y-0.5">
                                            <InfoRow icon={User} label="Full Name" value={profile.full_name} />
                                            <InfoRow icon={Shield} label="Username" value={profile.username} />
                                            <InfoRow icon={Building} label="Organization" value={profile.org_name || '—'} />
                                            <InfoRow icon={Calendar} label="Account Created" value={formatDate(profile.date_joined)} />
                                        </div>
                                    </SectionCard>

                                    {/* Role-specific information */}
                                    {profile.role === 'teacher' && profile.teacher_profile && (
                                        <SectionCard title="Teacher Profile" subtitle="Professional details" icon={BookOpen}>
                                            <div className="space-y-0.5">
                                                <InfoRow icon={Phone} label="Contact Number" value={profile.teacher_profile.contact_number} />
                                                <InfoRow icon={Award} label="Specialization" value={profile.teacher_profile.specialization} />
                                                <InfoRow icon={GraduationCap} label="Qualification" value={profile.teacher_profile.qualification} />
                                            </div>
                                        </SectionCard>
                                    )}

                                    {profile.role === 'student' && profile.student_profile && (
                                        <SectionCard title="Student Profile" subtitle="Academic information" icon={GraduationCap}>
                                            <div className="space-y-0.5">
                                                <InfoRow icon={BookOpen} label="Grade" value={`${profile.student_profile.grade_name} ${profile.student_profile.section}`} />
                                                <InfoRow icon={Calendar} label="Academic Year" value={profile.student_profile.academic_year} />
                                                <InfoRow icon={Users} label="Guardian" value={`${profile.student_profile.guardian_name} (${profile.student_profile.guardian_relation})`} />
                                                <InfoRow icon={Phone} label="Guardian Contact" value={profile.student_profile.guardian_contact} />
                                            </div>
                                        </SectionCard>
                                    )}

                                    {/* Editable fields */}
                                    <SectionCard title="Edit Profile" subtitle="Update your personal information" icon={UserCircle}>
                                        <div className="space-y-4">
                                            {/* Email */}
                                            <CustomInput
                                                label="Email Address"
                                                icon={Mail}
                                                type="email"
                                                value={email}
                                                onChange={(e: any) => setEmail(e.target.value)}
                                                placeholder="your@email.com"
                                            />

                                            {/* Gender */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted ml-1">Gender</label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {['Male', 'Female', 'Other'].map((g) => (
                                                        <button
                                                            key={g}
                                                            type="button"
                                                            onClick={() => setGender(g)}
                                                            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border-2 transition-all duration-300 cursor-pointer ${
                                                                gender === g
                                                                    ? 'bg-primary/15 text-primary border-primary/30'
                                                                    : 'bg-light/5 text-text-muted border-light/10 hover:border-primary/20 hover:text-text-heading'
                                                            }`}
                                                        >
                                                            {g}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <FormButton
                                                onClick={handleSaveProfile}
                                                isLoading={isSavingProfile}
                                                className="w-full mt-2"
                                            >
                                                <Save size={16} strokeWidth={2.5} />
                                                Save Changes
                                            </FormButton>
                                        </div>
                                    </SectionCard>
                                </div>

                                {/* ── RIGHT COLUMN: Security ── */}
                                <div className={`flex flex-col gap-5 ${activeSection !== 'security' ? 'hidden lg:flex' : ''}`}>
                                    <SectionCard title="Change Password" subtitle="Keep your account secure" icon={KeyRound}>
                                        <div className="space-y-4">
                                            {/* Security tips */}
                                            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5">
                                                <div className="flex items-start gap-2.5">
                                                    <Shield size={16} className="text-primary mt-0.5 shrink-0" strokeWidth={2.5} />
                                                    <div>
                                                        <p className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Security Tips</p>
                                                        <ul className="text-xs text-text-muted font-medium space-y-1">
                                                            <li className="flex items-center gap-1.5">
                                                                <ChevronRight size={10} className="text-primary shrink-0" />
                                                                Use at least 6 characters
                                                            </li>
                                                            <li className="flex items-center gap-1.5">
                                                                <ChevronRight size={10} className="text-primary shrink-0" />
                                                                Mix letters, numbers, and symbols
                                                            </li>
                                                            <li className="flex items-center gap-1.5">
                                                                <ChevronRight size={10} className="text-primary shrink-0" />
                                                                Avoid using your username or name
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <CustomInput
                                                label="Current Password"
                                                icon={Lock}
                                                type={showOld ? 'text' : 'password'}
                                                value={oldPassword}
                                                onChange={(e: any) => setOldPassword(e.target.value)}
                                                placeholder="••••••••"
                                                suffix={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowOld(!showOld)}
                                                        className="p-1 text-text-muted hover:text-primary transition-colors cursor-pointer outline-none"
                                                    >
                                                        {showOld ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                                                    </button>
                                                }
                                            />

                                            <CustomInput
                                                label="New Password"
                                                icon={KeyRound}
                                                type={showNew ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e: any) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                suffix={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNew(!showNew)}
                                                        className="p-1 text-text-muted hover:text-primary transition-colors cursor-pointer outline-none"
                                                    >
                                                        {showNew ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                                                    </button>
                                                }
                                            />

                                                {/* Password strength indicator */}
                                                {newPassword && (
                                                    <div className="flex gap-1 mt-2">
                                                        {[1, 2, 3, 4].map((level) => {
                                                            const strength =
                                                                (newPassword.length >= 6 ? 1 : 0) +
                                                                (/[A-Z]/.test(newPassword) ? 1 : 0) +
                                                                (/[0-9]/.test(newPassword) ? 1 : 0) +
                                                                (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0);
                                                            const colors = ['bg-failure', 'bg-warning', 'bg-info', 'bg-success'];
                                                            return (
                                                                <div
                                                                    key={level}
                                                                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= strength ? colors[strength - 1] : 'bg-light/10'
                                                                        }`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                            <CustomInput
                                                label="Confirm New Password"
                                                icon={Lock}
                                                type={showConfirm ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e: any) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                suffix={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirm(!showConfirm)}
                                                        className="p-1 text-text-muted hover:text-primary transition-colors cursor-pointer outline-none"
                                                    >
                                                        {showConfirm ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                                                    </button>
                                                }
                                            />

                                            <FormButton
                                                onClick={handleChangePassword}
                                                isLoading={isSavingPassword}
                                                className="w-full mt-2"
                                            >
                                                <Lock size={16} strokeWidth={2.5} />
                                                Change Password
                                            </FormButton>
                                        </div>
                                    </SectionCard>
                                </div>
                            </div>
                        </div>
                    </div>
                    <BackToTop scrollRef={scrollRef} />
                </div>
                <DecidePopup />
            </section>
        </div>
    );
};
