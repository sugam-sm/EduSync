import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, UserRound, Hash, School } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { CustomDropdown } from '../../../components/Custom/customDropdown';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { updateGrade, type GradeDetails } from '../../../features/management/gradeSlice';
import { fetchUsers } from '../../../features/management/userSlice';
import { addToast } from '../../../features/toasts/toastSlice';
import { Portal } from '../../../components/Portal';

export const UpdateGradePopup = ({ isOpen, onClose, grade }: { isOpen: boolean; onClose: () => void; grade: GradeDetails | null }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, grades } = useSelector((state: RootState) => state.grade);
    const { users } = useSelector((state: RootState) => state.user);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    
    const [form, setForm] = useState({ name: '', section: '', class_teacher: '' as string | number });
    const [sectionMode, setSectionMode] = useState<'alpha' | 'numeric'>('alpha');

    useEffect(() => {
        if (isOpen) dispatch(fetchUsers());
        if (grade) {
            setForm({ 
                name: grade.name, 
                section: grade.section, 
                class_teacher: grade.class_teacher ? String(grade.class_teacher) : '' 
            });
            setSectionMode(isNaN(Number(grade.section)) ? 'alpha' : 'numeric');
        }
    }, [isOpen, grade, dispatch]);

    const handleClose = () => {
        setForm({ name: '', section: '', class_teacher: '' });
        setSectionMode('alpha');
        onClose();
    };

    const activeTeacherIds = grades
        .filter(g => g.is_active && g.id !== grade?.id && g.class_teacher)
        .map(g => Number(g.class_teacher));

    const availableTeachers = users.filter(u => 
        u.role_name === 'Teacher' && !activeTeacherIds.includes(Number(u.id))
    );

    const teacherOptions = [
        { label: "No Teacher Assigned", value: '' },
        ...availableTeachers.map(t => ({ label: t.fullname || t.username, value: t.id }))
    ];

    const sectionOptions = sectionMode === 'alpha' 
        ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] 
        : ['1', '2', '3', '4', '5', '6', '7', '8'];

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        
        if (!grade || grade.id === undefined) return;

        const isUnchanged = 
            form.name === grade.name && 
            form.section === grade.section && 
            String(form.class_teacher || '') === String(grade.class_teacher || '');

        if (isUnchanged) {
            dispatch(addToast({ message: "No changes detected.", type: 'info' }));
            return;
        }
        
        const isDuplicate = grades.some(g => 
            g.is_active && 
            g.id !== grade.id && 
            g.name === form.name && 
            g.section === form.section
        );

        if (isDuplicate) {
            dispatch(addToast({ message: "A grade with this name and section already exists.", type: 'failure' }));
            return;
        }

        if (!form.name.trim()) {
            dispatch(addToast({ message: "Grade Name is required.", type: 'info' }));
            return;
        }

        if (!form.section) {
            dispatch(addToast({ message: "Section is required.", type: 'info' }));
            return;
        }

        openDecidePopup({
            question: "Confirm changes for the grade detail?",
            confirmText: "Yes, Change",
            cancelText: "Cancel Update",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(updateGrade({ 
                    gradeId: grade.id!, 
                    gradeData: { 
                        ...grade,
                        name: form.name,
                        section: form.section,
                        class_teacher: form.class_teacher === '' ? null : Number(form.class_teacher) 
                    } as GradeDetails
                }));
                
                if (updateGrade.fulfilled.match(result)) {
                    dispatch(addToast({ message: 'Grade updated successfully.', type: 'success' }));
                    handleClose();
                } else {
                    const errorMessage = (result.payload as any)?.detail || "Failed to update grade.";
                    dispatch(addToast({ message: errorMessage, type: 'failure' }));
                }
            }
        });
    };

    if (!isOpen || !grade) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-lg overflow-hidden flex flex-col gap-2">
                    <div className="flex justify-between items-center p-3 border-2 border-light/10 bg-surface rounded-3xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                <School size={24} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-bold text-primary">Update Grade</h2>
                        </div>
                        <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-180 cursor-pointer">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="bg-surface border-2 border-light/10 rounded-3xl p-8 space-y-5">
                        <CustomInput 
                            label="Grade Name" 
                            value={form.name} 
                            onChange={(e: any) => setForm({...form, name: e.target.value})} 
                            placeholder="e.g. 10 or AI"
                            roleColor="primary"
                        />

                        <CustomDropdown 
                            label="Class Teacher (Optional)"
                            value={form.class_teacher}
                            options={teacherOptions}
                            onChange={(val: any) => setForm({...form, class_teacher: val})}
                            icon={UserRound}
                        />

                        <div className="space-y-2">
                            <span className='text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1'>Section Type</span>
                            <div className="flex gap-2 p-1 bg-light/5 rounded-2xl border-2 border-light/10">
                                <button type="button" onClick={() => setSectionMode('alpha')} className={`flex-1 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${sectionMode === 'alpha' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Letters (A-H)</button>
                                <button type="button" onClick={() => setSectionMode('numeric')} className={`flex-1 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${sectionMode === 'numeric' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}>Numbers (1-8)</button>
                            </div>
                        </div>

                        <CustomDropdown 
                            label="Select Section"
                            value={form.section}
                            options={sectionOptions}
                            onChange={(val: any) => setForm({...form, section: val})}
                            icon={Hash}
                        />
                    </div>

                    <div className="p-2 border-2 rounded-3xl border-light/10 flex gap-3 bg-light/5">
                        <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1' />
                        <FormButton type="submit" isLoading={isLoading} variant='primary' className='flex-2'>
                            Update Grade
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};