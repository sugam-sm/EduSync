import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, UserRound, Hash, } from "lucide-react";
import { type RootState, type AppDispatch } from '../../../store';
import { CustomInput } from '../../../components/Custom/customInput';
import { CustomDropdown } from '../../../components/Custom/customDropdown';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { updateGrade, type GradeDetails } from '../../../features/organization/gradeSlice';
import { fetchUsers } from '../../../features/organization/userSlice';
import { addToast } from '../../../features/toasts/toastSlice';
import { Portal } from '../../../components/Portal';

export const UpdateGradePopup = ({ isOpen, onClose, grade }: { isOpen: boolean; onClose: () => void; grade: GradeDetails | null }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, grades } = useSelector((state: RootState) => state.grade);
    const { users } = useSelector((state: RootState) => state.user);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    
    const [form, setForm] = useState({ name: '', section: '', class_teacher: '' as string | number, is_active: true });
    const [sectionMode, setSectionMode] = useState<'alpha' | 'numeric'>('alpha');

    useEffect(() => {
        if (isOpen) dispatch(fetchUsers());
        if (grade) {
            setForm({ 
                name: grade.name, 
                section: grade.section, 
                class_teacher: grade.class_teacher ? String(grade.class_teacher) : '',
                is_active: grade.is_active ?? false
            });
            setSectionMode(isNaN(Number(grade.section)) ? 'alpha' : 'numeric');
        }
    }, [isOpen, grade, dispatch]);

    const handleClose = () => {
        setForm({ name: '', section: '', class_teacher: '', is_active: true });
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
            String(form.class_teacher || '') === String(grade.class_teacher || '') &&
            form.is_active === grade.is_active;

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
                        class_teacher: form.class_teacher === '' ? null : Number(form.class_teacher),
                        is_active: form.is_active
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-extrabold text-primary">Update Grade</h2>
                                <p className="text-text-muted mt-1 font-medium">Modify existing grade information</p>
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

                            <div className="flex items-center gap-3 p-1">
                                <span className="font-bold text-text-muted">Grade Status</span>

                                <button 
                                    type="button" 
                                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                    className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 hover:cursor-pointer ${
                                    form.is_active ? 'bg-success/50' : 'bg-failure'
                                    }`}
                                >
                                    <div
                                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                                        form.is_active ? 'translate-x-7' : 'translate-x-0'
                                    }`}
                                    />
                                </button>

                                <span
                                    className={`font-bold text-sm ${
                                    form.is_active ? 'text-success' : 'text-failure'
                                    }`}
                                >
                                    {form.is_active ? "ACTIVE" : "INACTIVE"}
                                </span>
                            </div>

                            <CustomDropdown 
                                label="Class Teacher (Optional)"
                                value={form.class_teacher}
                                options={teacherOptions}
                                onChange={(val: any) => setForm({...form, class_teacher: val})}
                                className='w-full'
                                icon={UserRound}
                            />

                            <div className="space-y-2">
                                <span className='text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1'>Section Type</span>
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
                            Update Grade
                        </FormButton>
                    </div>
                </form>
                <DecidePopup />
            </div>
        </Portal>
    );
};