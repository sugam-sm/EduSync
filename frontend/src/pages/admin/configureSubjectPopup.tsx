import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Settings2, Plus, School, UserRound } from "lucide-react";

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
    const { assignSub, isLoading } = useSelector((state: RootState) => state.assignsub);
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
        const teachersAssignedToOtherSubjects = assignSub
            .filter(a => a.subject !== subject.id && a.teacher !== null)
            .map(a => Number(a.teacher));

        const filteredTeachers = (users || [])
            .filter(u => u.role_name === 'Teacher')
            .filter(u => !teachersAssignedToOtherSubjects.includes(Number(u.id)));

        return filteredTeachers.map(u => ({
            label: `${u.fullname} (${u.username})`,
            value: u.id
        }));
    }, [users, assignSub, subject.id]);

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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
                <div className="w-full max-w-3xl overflow-hidden flex flex-col gap-4">
                    
                    <div className="flex justify-between items-center p-3 border-2 border-light/10 rounded-3xl bg-surface">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-2xl bg-primary/10 text-primary transition-colors duration-300">
                                <Settings2 size={24} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-bold text-primary">Configure Subject</h2>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all duration-300 cursor-pointer hover:rotate-180 ">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="flex flex-col overflow-hidden">
                        <div className="px-8 pt-6">
                            <div className="p-3 rounded-2xl uppercase border border-light/10 text-center font-bold text-lg bg-primary/10 text-primary">
                                Subject: {subject.name}
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Current Configurations</h3>
                                <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
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
                                                        className="p-2 text-text-muted hover:text-failure hover:bg-failure/10 rounded-full transition-all duration:300 cursor-pointer hover:rotate-270"
                                                    >
                                                        <X size={25} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 border-2 border-dashed border-light/10 rounded-3xl">
                                            <p className="text-text-muted font-medium italic">No active assignments for this subject.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-light/10">
                                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Add New Configuration</h3>
                                <form onSubmit={handleAddAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </form>
                            </div>
                        </div>

                        <div className="p-2 border-2 border-light/10 flex gap-3 bg-light/5 rounded-3xl">
                            <Button label="Close" onClick={onClose} variant='failure' className='flex-1' />
                            <FormButton 
                                onClick={handleAddAssignment}
                                isLoading={isLoading} 
                                variant='primary' 
                                className='flex-2'
                            >
                                <Plus size={20} className="mr-2" /> Assign to Class
                            </FormButton>
                        </div>
                    </div>
                </div>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default ConfigureSubjectPopup;