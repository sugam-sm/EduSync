import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, UserRound, Hash, School } from "lucide-react";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 border-2 border-light/10 bg-surface rounded-3xl m-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                            <School size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-bold text-primary">Add New Grade</h2>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-90 cursor-pointer">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
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

                    <span className='text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1'>Selection section type</span>
                    <div className="flex gap-2 p-1 bg-light/5 rounded-2xl border-2 border-light/10">
                        <button type="button" onClick={() => setSectionMode('alpha')} className={`flex-1 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${sectionMode === 'alpha' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Letters (A-H)</button>
                        <button type="button" onClick={() => setSectionMode('numeric')} className={`flex-1 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${sectionMode === 'numeric' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Numbers (1-8)</button>
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

                <div className="p-2 border-2 rounded-3xl border-light/5 flex gap-3 bg-light/5 m-4">
                    <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1' />
                    <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2'>
                        Create Grade
                    </FormButton>
                </div>
            </form>
            <DecidePopup />
        </div>
    );
};