import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, UserRoundPlus, GraduationCap, Users, Mail, Phone, 
  UserRound, VenusAndMars, BookOpen, School, HeartHandshake, Link 
} from "lucide-react";

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

  const initialFormState: User = {
    first_name: '', middle_name: '', last_name: '',
    email: '', role: 3, gender: 'Male', role_name: '', is_active: true, 
    student_profile: { grade: 0, name: '', section: '', academic_year: '', guardian_name: '', guardian_relation: '', guardian_contact: '' },
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

  const handleClose = () => {
    setFormData(initialFormState);
    setRole('Student');
    setGender('Male');
    setSelectedGradeId(0);
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
        if (contact.length !== 10 && contact.length !==0){
          dispatch(addToast({
            message:"Number should be of 10 digits",
            type: 'failure'
          }));
          return;
        }
      } else{
        requiredFields["guardian_name"] = formData.student_profile?.guardian_name;
        requiredFields["relation"] = formData.student_profile?.guardian_relation;
        const guardiancontact = formData.student_profile?.guardian_contact || "";
        requiredFields["guardian_contact"] = guardiancontact;
        if (guardiancontact.length !== 10 && guardiancontact.length !==0){
          dispatch(addToast({
            message:"Number should be of 10 digits",
            type: 'failure'
          }));
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

    const { student_profile, teacher_profile, ...baseData } = formData;
    const finalPayload: any = { ...baseData, gender, email: formData.email || null };

    if (role === 'Student') {
      const selectedGrade = grades.find(grade => String(grade.id) === String(selectedGradeId))

      console.log(selectedGrade)
      console.log(typeof(selectedGrade))

      finalPayload.role = 3;
      finalPayload.student_profile = {
         ...student_profile, 
         grade: Number(selectedGradeId),
         name: selectedGrade?.name,
         section: selectedGrade?.section,
      };
    } else {
      finalPayload.role = 2;
      finalPayload.teacher_profile = teacher_profile;
    }

    console.log(finalPayload)

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
          const element = document.createElement("a");
          const file = new Blob([
            `User: ${formData.first_name}\nUsername: ${username}\nPassword: ${generated_password}`
          ], {type: 'text/plain'});
          element.href = URL.createObjectURL(file);
          element.download = `${username}_credentials.txt`;
          element.click();

          dispatch(fetchUsers())

          handleClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
      <form onSubmit={handleCreation} className="w-full max-w-3xl overflow-hidden">
        
        <div className="flex justify-between items-center p-3 border-2 border-light/10 bg-surface rounded-3xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl ${role === 'Teacher' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>
                <UserRoundPlus size={24} strokeWidth={2.5} />
            </div>
            <h2 className={`text-xl font-bold ${role === 'Teacher' ? 'text-info' : 'text-primary'}`}>Create New {role}</h2>
          </div>
          <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all hover:rotate-90 cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="px-2 pt-4">
          <div className="flex gap-2 p-1 rounded-2xl border-2 border-light/10">
            <button type="button" onClick={() => setRole('Student')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${role === 'Student' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}><Users size={20} strokeWidth={3}/> Student</button>
            <button type="button" onClick={() => setRole('Teacher')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${role === 'Teacher' ? 'bg-info/35 text-info' : 'text-text-muted hover:bg-info/10'}`}><GraduationCap size={20} strokeWidth={3}/> Teacher</button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[60vh] md:overflow-y-visible overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomInput label="First Name" name="first_name" value={formData.first_name} onChange={handleInputChange} icon={UserRound} placeholder="First Name" roleColor={roleColor} />
                <CustomInput label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleInputChange} placeholder="Middle" roleColor={roleColor} />
                <CustomInput label="Last Name" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Last" roleColor={roleColor} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomInput label="Email Address" name="email" value={formData.email} onChange={handleInputChange} icon={Mail} placeholder="email@domain.com" type="email" roleColor={roleColor} />
                <CustomDropdown label="Gender" icon={VenusAndMars} value={gender} onChange={setGender} className="w-full" options={['Male', 'Female', 'Other']} />
            </div>

            <div className="pt-3 border-t border-light/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {role === 'Teacher' ? (
                        <>
                            {/* Teacher contact number */}
                            <CustomInput label="Contact No." name="teacher_profile.contact_number" value={formData.teacher_profile?.contact_number} onChange={handleInputChange} icon={Phone} placeholder="Contact" roleColor="info" />
                            {/* specialization */}
                            <CustomInput label="Specialization" name="teacher_profile.specialization" value={formData.teacher_profile?.specialization} onChange={handleInputChange} icon={BookOpen} placeholder="Subject" roleColor="info" />
                            {/* qualification */}
                            <CustomInput label="Qualification" name="teacher_profile.qualification" value={formData.teacher_profile?.qualification} onChange={handleInputChange} icon={GraduationCap} placeholder="Degree" className="md:col-span-2" roleColor="info" />
                        </>
                    ) : (
                        <>
                            <CustomDropdown 
                              label="Assign Grade" 
                              icon={School} 
                              value={selectedGradeId} 
                              onChange={setSelectedGradeId} 
                              className="w-full"
                              options={gradeOptions}
                            />
                            <CustomInput label="Guardian Name" name="student_profile.guardian_name" value={formData.student_profile?.guardian_name} onChange={handleInputChange} icon={HeartHandshake} placeholder="Name" roleColor="primary" />
                            <CustomInput label="Guardian Relation" name="student_profile.guardian_relation" value={formData.student_profile?.guardian_relation} onChange={handleInputChange} icon={Link} placeholder="Relation" roleColor="primary" />
                            <CustomInput label="Guardian Contact" name="student_profile.guardian_contact" value={formData.student_profile?.guardian_contact} onChange={handleInputChange} icon={Phone} placeholder="Phone" roleColor="primary" />
                        </>
                    )}
                </div>
            </div>
        </div>

        <div className="p-2 border-2 rounded-3xl border-light/5 flex gap-3 bg-light/5">
          <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1' />
          <FormButton type="submit" isLoading={isLoading} variant={role === 'Teacher' ? 'info' : 'primary'} className='flex-2'>Create {role}</FormButton>
        </div>
      </form>
      <DecidePopup />
    </div>
  );
};