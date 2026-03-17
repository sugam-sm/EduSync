import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, UserRound, Hash } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { CustomDropdown } from '../../../components/Custom/customDropdown';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { createGrade } from '../../../features/organization/gradeSlice';
import { fetchUsers } from '../../../features/organization/userSlice';
import { addToast } from '../../../features/toasts/toastSlice';

export const CreateGradePopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, grades } = useSelector((state: RootState) => state.grade);
    const { users } = useSelector((state: RootState) => state.user);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const [form, setForm] = useState({ name: '', section: '', class_teacher: '' });
    const [sectionMode, setSectionMode] = useState<'alpha' | 'numeric'>('alpha');

    const handleClose = () => {
        setForm({ name: '', section: '', class_teacher: '' });
        setSectionMode('alpha');
        onClose();
    };

    useEffect(() => {
        if (isOpen) dispatch(fetchUsers());
    }, [isOpen, dispatch]);

    useEffect(() => {
        setForm(prev => ({ ...prev, section: '' }));
    }, [sectionMode]);

    const activeTeacherIds = grades.filter(g => g.is_active).map(g => g.class_teacher);
    const availableTeachers = users.filter(u => u.role_name === 'Teacher' && !activeTeacherIds.includes(Number(u.id)));
    
    const teacherOptions = [
    { label: "No Teacher Assigned", value: '' },
    ...(availableTeachers || []).map(t => ({ 
        label: `${t.fullname || 'Unknown'} (${t.username})`, 
        value: t.id 
    }))
];

    const sectionOptions = sectionMode === 'alpha' 
        ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] 
        : ['1', '2', '3', '4', '5', '6', '7', '8'];

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        const isDuplicate = grades.some(g => g.is_active && g.name === form.name && g.section === form.section);
        if (isDuplicate) {
            dispatch(addToast({ message: "A grade with this name and section already exists.", type: 'failure' }));
            return;
        }

        const requiredFields: Record<string, any> = {
            "Grade Name": form.name,
            "Section": form.section
        };

        for (const [fieldName, val] of Object.entries(requiredFields)) {
            if (!val || (typeof val === 'string' && val.trim() === '')) {
                dispatch(addToast({ message: `${fieldName} is required.`, type: 'info' }));
                return;
            }
        }

        openDecidePopup({
            question: `Create grade "${form.name} ${form.section}"?`,
            confirmText: "Yes, Create",
            cancelText: "Cancel",
            variant: "secondary",
            onConfirm: async () => {
                const result = await dispatch(createGrade(form as any));
                if (createGrade.fulfilled.match(result)) {
                    handleClose();
                    dispatch(addToast({ message: 'Grade created successfully.', type: 'success' }));
                } else {
                    const errorMessage = (result.payload as any)?.class_teacher?.[0] || 
                                       (result.payload as any)?.section?.[0] || 
                                       (result.payload as any)?.detail || 
                                       "Failed to create grade.";
                    dispatch(addToast({ message: errorMessage, type: 'failure' }));
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                <div className="px-8 pt-8 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-extrabold text-primary">New Grade</h2>
                            <p className="text-text-muted mt-1 font-medium">Please enter the details to register a new grade</p>
                        </div>
                        <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
                    </div>
                </div>

                <div className="px-8 pb-8 space-y-6 overflow-y-auto md:overflow-y-visible flex-1">
                    <div className="space-y-4">
                        <CustomInput 
                            label="Grade Name" 
                            value={form.name} 
                            onChange={(e: any) => setForm({...form, name: e.target.value})} 
                            placeholder="e.g. 10 or AI"
                            roleColor="primary"
                        />

                        <CustomDropdown 
                            label="Class Teacher"
                            value={form.class_teacher}
                            options={teacherOptions}
                            onChange={(val: any) => setForm({...form, class_teacher: val})}
                            className="w-full"
                            icon={UserRound}
                        />

                        <div className="space-y-2">
                            <span className='text-[11px] uppercase tracking-widest font-bold text-text-muted pl-1'>Selection section type</span>
                            <div className="flex gap-2 p-1 rounded-2xl border-2 border-light/10">
                                <button type="button" onClick={() => setSectionMode('alpha')} className={`flex-1 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${sectionMode === 'alpha' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Letters (A-H)</button>
                                <button type="button" onClick={() => setSectionMode('numeric')} className={`flex-1 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${sectionMode === 'numeric' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Numbers (1-8)</button>
                            </div>
                        </div>

                        <CustomDropdown 
                            label="Select Section"
                            value={form.section}
                            options={sectionOptions}
                            onChange={(val: any) => setForm({...form, section: val})}
                            className='w-full'
                            icon={Hash}
                        />
                    </div>
                </div>

                <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
                    <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
                    <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2 py-3'>
                        Create Grade
                    </FormButton>
                </div>
            </form>
            <DecidePopup />
        </div>
    );
};