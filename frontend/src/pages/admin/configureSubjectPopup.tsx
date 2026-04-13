import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, School, UserRound } from "lucide-react";

import { CustomDropdown } from '../../components/Custom/customDropdown';
import { FormButton } from '../../components/Buttons/formButton';
import { Button } from '../../components/Buttons/customButton';
import { DecisionPopup } from '../../components/decision popup';
import { Portal } from '../../components/Portal';

import { type RootState, type AppDispatch } from '../../store';
import { fetchAssignSubs, createAssignSub, deleteAssignSub } from '../../features/organization/assignSubjectSlice';
import { fetchGrades } from '../../features/organization/gradeSlice';
import { fetchUsers } from '../../features/organization/userSlice';
import { addToast } from '../../features/toasts/toastSlice';
import { type SubjectDetails } from '../../features/organization/subjectSlice';

interface ConfigureSubjectPopupProps {
    isOpen: boolean;
    onClose: () => void;
    subject: SubjectDetails;
}

export const ConfigureSubjectPopup = ({ isOpen, onClose, subject }: ConfigureSubjectPopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { assignSub, isLoading } = useSelector((state: RootState) => state.assignSub);
    const { grades } = useSelector((state: RootState) => state.grade);
    const { users } = useSelector((state: RootState) => state.user);
    
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    
    const [selectedGrade, setSelectedGrade] = useState<string | number>('');
    const [selectedTeacher, setSelectedTeacher] = useState<string | number>('');

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchAssignSubs());
            dispatch(fetchGrades());
            dispatch(fetchUsers());
        }
    }, [isOpen, dispatch]);

    const assignSubs = assignSub.filter(a => a.subject === subject.id);

    const gradeOptions = (grades || []).map(g => ({
        label: `${g.name} "${g.section}"`,
        value: g.id
    }));

    const teacherOptions = useMemo(() => {
        const filteredTeachers = (users || [])
            .filter(u => u.role_name === 'teacher');

        return filteredTeachers.map(u => ({
            label: `${u.fullname} (${u.username})`,
            value: u.id
        }));
    }, [users]);

    const handleAddAssignment = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        
        if (!selectedGrade) {
            dispatch(addToast({ message: "Please select a class", type: 'info' }));
            return;
        }

        if (!selectedTeacher) {
            dispatch(addToast({ message: "Teacher assignment is required", type: 'info' }));
            return;
        }

        const isGradeAlreadyOccupied = assignSubs.some(a => Number(a.grade) === Number(selectedGrade));
        if (isGradeAlreadyOccupied) {
            dispatch(addToast({ message: "This class already has this subject assigned.", type: 'failure' }));
            return;
        }
        
        const teacherObj = teacherOptions.find(t => t.value === selectedTeacher);
        const gradeObj = gradeOptions.find(g => g.value === selectedGrade);

        openDecidePopup({
            question: `Are you sure you want to assign ${teacherObj?.label} to ${gradeObj?.label} for ${subject.name}?`,
            confirmText: "Yes, Assign",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(createAssignSub({ 
                    subject: subject.id!, 
                    grade: Number(selectedGrade),
                    teacher: Number(selectedTeacher)
                }));

                if (createAssignSub.fulfilled.match(result)) {
                    dispatch(addToast({ message: "Assignment added successfully", type: 'success' }));
                    setSelectedGrade('');
                    setSelectedTeacher('');
                }
            }
        });
    };

    const handleDelete = (id: number) => {
        openDecidePopup({
            question: "Remove this subject assignment?",
            confirmText: "Remove",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(deleteAssignSub(id));
                if (deleteAssignSub.fulfilled.match(result)) {
                    dispatch(addToast({ message: "Assignment removed", type: 'success' }));
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
                <div className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
                    
                    <div className="px-8 pt-6 pb-2">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-extrabold text-primary h-full">Configure Subject</h2>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-4 space-y-5 flex-1">
                        <div className="">
                            <div className="p-1 rounded-2xl uppercase border border-light/10 text-center font-bold text-lg bg-primary/10 text-primary">
                                {subject.name}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Current Configurations</h3>
                            <div className="space-y-3 h-[33vh] sm:h-[46vh] overflow-y-auto border-2 border-dashed border-light/10 rounded-3xl p-2">
                                {assignSubs.length > 0 ? (
                                    assignSubs.map(a => {
                                        const gradeData = grades.find(g => g.id === a.grade);
                                        const gradeLabel = gradeData ? `${gradeData.name} "${gradeData.section}"` : "Unknown Class";
                                        
                                        return (
                                            <div key={a.id} className="flex justify-between items-center p-4 bg-light/5 border border-light/10 rounded-2xl group hover:border-primary/50 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary border border-light/10">
                                                        <School size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-heading">{gradeLabel}</p>
                                                        <p className="text-sm text-text-muted flex items-center gap-1">
                                                            <UserRound size={14} /> {a.teacher_name || "No Teacher"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDelete(a.id!)}
                                                    className="p-2 text-text-muted hover:text-failure hover:bg-failure/20 rounded-full transition-all duration-300 cursor-pointer hover:rotate-90"
                                                >
                                                    <X size={23} strokeWidth={3} />
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center text-center py-10 h-full">
                                        <p className="text-text-muted font-medium italic">No active assignments for this subject.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">Add New Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomDropdown 
                                    label="Select Class" 
                                    icon={School} 
                                    value={selectedGrade} 
                                    onChange={setSelectedGrade} 
                                    className='w-full'
                                    options={gradeOptions} 
                                />
                                <CustomDropdown 
                                    label="Assign Teacher" 
                                    icon={UserRound} 
                                    value={selectedTeacher} 
                                    onChange={setSelectedTeacher} 
                                    className='w-full'
                                    options={teacherOptions} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex gap-4 pt-1 bg-transparent">
                        <Button label="Close" onClick={onClose} variant='failure' className='flex-1 py-3' />
                        <FormButton 
                            onClick={handleAddAssignment}
                            isLoading={isLoading} 
                            variant='primary' 
                            className='flex-2 py-3'
                        >
                            Assign to Class
                        </FormButton>
                    </div>
                </div>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default ConfigureSubjectPopup;