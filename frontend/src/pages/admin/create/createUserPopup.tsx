import React, { useState, useEffect, useMemo } from 'react';
import {   X, GraduationCap, Users, Mail, Phone, UserRound, VenusAndMars, BookOpen, School, HeartHandshake, Link, Copy, Check } from "lucide-react";

import { CustomDropdown } from '../../../components/Custom/customDropdown';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';

import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '../../../store';
import { type User, createUser, resetUserState } from '../../../features/organization/userSlice';
import { addToast } from '../../../features/toasts/toastSlice';
import { fetchGrades } from '../../../features/organization/gradeSlice';
import { fetchUsers } from '../../../features/organization/userSlice';

export const CreateUserPopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, isError, message } = useSelector((state: RootState) => state.user);
  const { grades } = useSelector((state: RootState) => state.grade);

  const { openDecidePopup, DecidePopup } = DecisionPopup();

  const [role, setRole] = useState<'Student' | 'Teacher'>('Student');
  const [gender, setGender] = useState('Male');
  const [selectedGradeId, setSelectedGradeId] = useState<number>(0);

  // Generated credentials state
  const [generatedCreds, setGeneratedCreds] = useState<{ username: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const initialFormState: User = {
    first_name: '', middle_name: '', last_name: '',
    email: '', role: 3, gender: 'Male', role_name: '', is_active: true, 
    student_profile: { grade: 0, grade_name: '', section: '', academic_year: '', guardian_name: '', guardian_relation: '', guardian_contact: '' },
    teacher_profile: { contact_number: '', specialization: '', qualification: '' },
  };

  const [formData, setFormData] = useState<User>(initialFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [profile, field] = name.split('.') as ['student_profile' | 'teacher_profile', string];
      setFormData((prev) => ({
        ...prev,
        [profile]: { ...prev[profile], [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setRole('Student');
    setGender('Male');
    setSelectedGradeId(0);
    setGeneratedCreds(null);
    setCopiedField(null);
    dispatch(resetUserState());
    onClose();
  };

  const handleCreation = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    // form validation
    const requiredFields: Record<string, any> = {
      "first_name": formData.first_name,
      "last_name": formData.last_name,
    };
    if (role == "Teacher"){
        const contact = formData.teacher_profile?.contact_number || "";
        requiredFields["contact_number"] = contact;
        requiredFields["specialization"] = formData.teacher_profile?.specialization;
        requiredFields["qualification"] = formData.teacher_profile?.qualification;
        if (contact.length !== 10 && contact.length !== 0) {
          dispatch(addToast({ message: "Contact number should be of 10 digits", type: 'failure' }));
          return;
        }
      } else{
        requiredFields["guardian_name"] = formData.student_profile?.guardian_name;
        requiredFields["relation"] = formData.student_profile?.guardian_relation;
        const guardiancontact = formData.student_profile?.guardian_contact || "";
        requiredFields["guardian_contact"] = guardiancontact;
        if (guardiancontact.length !== 10 && guardiancontact.length !== 0) {
          dispatch(addToast({ message: "Guardian contact should be of 10 digits", type: 'failure' }));
          return;
        }
      }

    for (const [fieldName, val] of Object.entries(requiredFields)) {
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        dispatch(addToast({
          message: `${fieldName.replace('_',' ')} is required.`,
          type: 'info'
        }));
        return;
      }
    }

    if (role === 'Student' && !selectedGradeId) {
      dispatch(addToast({ message: "Please select a Grade", type: 'info' }));
      return;
    }

    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      dispatch(addToast({ message: "Invalid email format.", type: 'info' }));
      return;
    }

    const { student_profile, teacher_profile, ...baseData } = formData;
    const finalPayload: any = { ...baseData, gender, email: formData.email || null };

    if (role === 'Student') {
      const selectedGrade = grades.find(grade => String(grade.id) === String(selectedGradeId))

      finalPayload.role_name = 'student';
      finalPayload.student_profile = {
          ...student_profile, 
          grade: Number(selectedGradeId),
          grade_name: selectedGrade?.name,
          section: selectedGrade?.section,
      };
    } else {
      finalPayload.role_name = 'teacher';
      finalPayload.teacher_profile = teacher_profile;
    }

    openDecidePopup({
      question: `Create ${role} ${finalPayload.first_name} ${finalPayload.last_name} ?`,
      confirmText: "Yes, Create",
      cancelText: "Cancel",
      variant: "secondary",
      onConfirm: async () => { 
        const resultAction = await dispatch(createUser(finalPayload));

        if (createUser.fulfilled.match(resultAction)) {
          dispatch(addToast({ message: 'User Added Successfully.', type: 'success' }));
          
          const { username, generated_password } = resultAction.payload;
          setGeneratedCreds({ username, password: generated_password });
          dispatch(fetchUsers());
        }
      }
    });
  };

  useEffect(() => {
    if (isError && message) {
      dispatch(addToast({ message, type: 'failure' }));
      dispatch(resetUserState());
    }
  }, [isError, message, dispatch]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchGrades())
    }
  }, [isOpen, dispatch])

  const gradeOptions = useMemo(() => {
    return (grades || []).map(grade => ({
      label: `${grade.name} "${grade.section}"`,
      value: grade.id
    }));
  }, [grades]);

  if (!isOpen) return null;
  const roleColor = role === 'Teacher' ? 'info' : 'primary';

  // Show generated credentials screen
  if (generatedCreds) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col">
          <div className="px-8 pt-8 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-extrabold text-success">{role} Created!</h2>
                <p className="text-text-muted mt-1 font-medium text-sm">
                  Save these credentials — the password cannot be retrieved later.
                </p>
              </div>
              <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
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

            <Button label="Done" onClick={handleClose} variant='primary' className='w-full py-3' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
      <form onSubmit={handleCreation} className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
        <div className="px-8 pt-8 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className={`text-3xl font-extrabold ${role === 'Teacher' ? 'text-info' : 'text-primary'}`}>New {role}</h2>
              <p className="text-text-muted mt-1 font-medium">Please enter the details to register</p>
            </div>
            <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
          </div>
        </div>

        <div className="px-8 mb-4">
          <div className="flex gap-2 p-1 rounded-2xl border-2 border-light/10">
            <button type="button" onClick={() => setRole('Student')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${role === 'Student' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}><Users size={20} strokeWidth={3}/> Student</button>
            <button type="button" onClick={() => setRole('Teacher')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${role === 'Teacher' ? 'bg-info/35 text-info' : 'text-text-muted hover:bg-info/10'}`}><GraduationCap size={20} strokeWidth={3}/> Teacher</button>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-3 overflow-y-auto md:overflow-y-visible flex-1">
          <div className="space-y-3">
            <h3 className="text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomInput label="First Name" name="first_name" value={formData.first_name} onChange={handleInputChange} icon={UserRound} placeholder="Enter first name" roleColor={roleColor} />
              <CustomInput label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleInputChange} placeholder="Enter middle name" roleColor={roleColor} />
              <CustomInput label="Last Name" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Enter last name" roleColor={roleColor} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput label="Email Address" name="email" value={formData.email} onChange={handleInputChange} icon={Mail} placeholder="Enter email" type="email" roleColor={roleColor} />
              <CustomDropdown label="Gender" icon={VenusAndMars} value={gender} onChange={setGender} className="w-full" options={['Male', 'Female', 'Other']} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1">{role === 'Teacher' ? 'Professional Information' : 'Academic & Guardian Info'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {role === 'Teacher' ? (
                <>
                  <CustomInput label="Contact No." name="teacher_profile.contact_number" value={formData.teacher_profile?.contact_number} onChange={handleInputChange} icon={Phone} placeholder="Enter contact number" roleColor="info" />
                  <CustomInput label="Specialization" name="teacher_profile.specialization" value={formData.teacher_profile?.specialization} onChange={handleInputChange} icon={BookOpen} placeholder="Enter subject specialization" roleColor="info" />
                  <CustomInput label="Qualification" name="teacher_profile.qualification" value={formData.teacher_profile?.qualification} onChange={handleInputChange} icon={GraduationCap} placeholder="Enter highest level of Degree" className="md:col-span-2" roleColor="info" />
                </>
              ) : (
                <>
                  <CustomDropdown label="Assign Grade" icon={School} value={selectedGradeId} onChange={setSelectedGradeId} className="w-full" options={gradeOptions} />
                  <CustomInput label="Guardian Name" name="student_profile.guardian_name" value={formData.student_profile?.guardian_name} onChange={handleInputChange} icon={HeartHandshake} placeholder="Enter guardian name" roleColor="primary" />
                  <CustomInput label="Guardian Relation" name="student_profile.guardian_relation" value={formData.student_profile?.guardian_relation} onChange={handleInputChange} icon={Link} placeholder="Enter guardian relation" roleColor="primary" />
                  <CustomInput label="Guardian Contact" name="student_profile.guardian_contact" value={formData.student_profile?.guardian_contact} onChange={handleInputChange} icon={Phone} placeholder="Enter guardian's contact" roleColor="primary" />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
          <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
          <FormButton type="submit" isLoading={isLoading} variant={role === 'Teacher' ? 'info' : 'primary'} className='flex-2 py-3'>Create {role}</FormButton>
        </div>
      </form>
      <DecidePopup />
    </div>
  );
};