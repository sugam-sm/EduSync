import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, GraduationCap, Mail, Phone, 
  UserRound, VenusAndMars, BookOpen, School, HeartHandshake, Link, KeyRound 
} from "lucide-react";

import { CustomDropdown } from '../../../components/Custom/customDropdown';
import { CustomInput } from '../../../components/Custom/customInput';
import { FormButton } from '../../../components/Buttons/formButton';
import { Button } from '../../../components/Buttons/customButton';
import { DecisionPopup } from '../../../components/decision popup';
import { Portal } from '../../../components/Portal';

import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '../../../store';
import { type User, updateUser, resetUserState } from '../../../features/organization/userSlice';
import { addToast } from '../../../features/toasts/toastSlice';
import { fetchGrades } from '../../../features/organization/gradeSlice';
import { fetchUsers } from '../../../features/organization/userSlice';

interface UpdateUserPopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const UpdateUserPopup = ({ isOpen, onClose, user }: UpdateUserPopupProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.user);
  const { grades } = useSelector((state: RootState) => state.grade);

  const { openDecidePopup, DecidePopup } = DecisionPopup();

  const [role, setRole] = useState<'Student' | 'Teacher'>('Student');
  const [gender, setGender] = useState('Male');
  const [selectedClassId, setSelectedClassId] = useState<string | number>('');
  const [password, setPassword] = useState('');

  const [formData, setFormData] = useState<User>({
    id: 0, username: '',
    first_name: '', middle_name: '', last_name: '',
    email: '', role: 3, gender: 'Male', is_active: true, role_name: '',
    student_profile: { grade: 0, grade_name: '', section: '', academic_year: '', guardian_name: '', guardian_relation: '', guardian_contact: '' },
    teacher_profile: { contact_number: '', specialization: '', qualification: '' },
  });

  useEffect (() => {
    if (user) {
      setFormData(user);
      setRole(user.role_name === 'teacher' ? 'Teacher' : 'Student');
      setGender(user.gender || 'Male');
      setSelectedClassId(user.student_profile?.grade || '');
      setPassword('');
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchGrades())
    }
  }, [isOpen, dispatch]);

  const classOptions = useMemo(() => {
    return (grades || []).map(c => ({
      label: `${c.name} "${c.section}"`,
      value: c.id
    }));
  }, [grades]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [profile, field] = name.split('.') as [keyof User, string];
      setFormData((prev) => ({
        ...prev,
        [profile]: { ...(prev[profile] as object), [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const isUnchanged =
      formData.first_name === user?.first_name &&
      formData.middle_name === user?.middle_name &&
      formData.last_name === user?.last_name &&
      formData.email === user?.email &&
      formData.gender === user?.gender &&
      formData.is_active === user?.is_active &&
      password === '' &&
      (role === 'Teacher' || (
        Number(selectedClassId) === Number(user?.student_profile?.grade) &&
        formData.student_profile?.guardian_name === user?.student_profile?.guardian_name &&
        formData.student_profile?.guardian_relation === user?.student_profile?.guardian_relation &&
        formData.student_profile?.guardian_contact === user?.student_profile?.guardian_contact
      )) &&
      (role === 'Student' || (
        formData.teacher_profile?.contact_number === user?.teacher_profile?.contact_number &&
        formData.teacher_profile?.specialization === user?.teacher_profile?.specialization &&
        formData.teacher_profile?.qualification === user?.teacher_profile?.qualification
      ));

    if (isUnchanged) {
      dispatch(addToast({ message: "No changes detected.", type: 'info' }));
      return;
    }
    
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
      } else {
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
        dispatch(addToast({ message: `${fieldName.replace('_',' ')} is required.`, type: 'info' }));
        return;
      }
    }

    const finalPayload = {
      ...formData,
      gender,
      password: password.trim() !== '' ? password : undefined,
      role_name: role === 'Student' ? 'student' : 'teacher',
      student_profile: role === 'Student' ? { ...formData.student_profile, grade: selectedClassId } : undefined,
      teacher_profile: role === 'Teacher' ? formData.teacher_profile : undefined
    };

    openDecidePopup({
      question: "Confirm changes for the user detail?",
      confirmText: "Update",
      cancelText: "Cancel",
      variant: "secondary",
      onConfirm: async() => { 
        const resultAction = await dispatch(updateUser({
          userId: formData.id!,
          userData: finalPayload as any
        }));

        if (updateUser.fulfilled.match(resultAction)) {
          dispatch(addToast({ message: 'User Updated Successfully.', type: 'success' }));
          dispatch(fetchUsers())
          handleClose();
        }
      }
    });
  };

  const handleClose = () => {
    dispatch(resetUserState());
    onClose();
  };

  if (!isOpen) return null;
  const roleColor = role === 'Teacher' ? 'info' : 'primary';

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
        <form onSubmit={handleUpdate} noValidate className="w-full max-w-2xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh]">
          
          <div className="px-8 pt-8 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className={`text-3xl font-extrabold ${role === 'Teacher' ? 'text-info' : 'text-primary'}`}>Update {role}</h2>
              </div>
              <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"><X size={24} strokeWidth={3}/></button>
            </div>
          </div>

          <div className="px-8 mb-4">
            <div className={`p-3 rounded-2xl uppercase border border-light/10 text-center font-bold text-lg ${role === 'Teacher' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>
                {user?.username}
            </div>
          </div>

          <div className="px-8 pb-8 space-y-8 overflow-y-auto md:overflow-y-visible flex-1">
              <div className="flex items-center gap-4 py-2 border-b border-light/10 pb-4">
                <label className="text-sm font-semibold text-text-muted">Account Status:</label>
                 <button type="button" onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      is_active: !prev.is_active,
                    }))
                  }
                  className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 hover:cursor-pointer ${
                    formData.is_active ? "bg-success/50" : "bg-failure"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      formData.is_active ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>

                <span
                  className={`font-bold text-sm ${
                    formData.is_active ? "text-success" : "text-failure"
                  }`}
                >
                  {formData.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CustomInput label="First Name" name="first_name" value={formData.first_name} onChange={handleInputChange} icon={UserRound} placeholder="Enter first name" roleColor={roleColor} />
                    <CustomInput label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleInputChange} placeholder="Enter middle name" roleColor={roleColor} />
                    <CustomInput label="Last Name" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Enter Last name" roleColor={roleColor} />
                </div>

                <div>
                    <CustomInput label="Email Address" name="email" value={formData.email} onChange={handleInputChange} icon={Mail} placeholder="Enter email address" type="email" roleColor={roleColor} />
                </div>

                <div className = "grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomDropdown label="Gender" icon={VenusAndMars} value={gender} onChange={setGender} className='w-full' options={['Male', 'Female', 'Other']} />
                  <CustomInput label="New Password" name="password" value={password} onChange={(e: any) => setPassword(e.target.value)} icon={KeyRound} placeholder="Type a new password" type="password" roleColor={roleColor} />
                </div>
              </div>

              <div className="space-y-3">
                  <h3 className="text-sm uppercase tracking-widest font-bold text-text-muted/70 pl-1">{role === 'Teacher' ? 'Professional Information' : 'Academic & Guardian Info'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {role === 'Teacher' ? (
                          <>
                              <CustomInput label="Contact No." name="teacher_profile.contact_number" value={formData.teacher_profile?.contact_number} onChange={handleInputChange} icon={Phone} placeholder="Enter contact number" roleColor="info" />
                              <CustomInput label="Specialization" name="teacher_profile.specialization" value={formData.teacher_profile?.specialization} onChange={handleInputChange} icon={BookOpen} placeholder="Enter subject specialization" roleColor="info" />
                              <CustomInput label="Qualification" name="teacher_profile.qualification" value={formData.teacher_profile?.qualification} onChange={handleInputChange} icon={GraduationCap} placeholder="Enter highest level of degree" className="md:col-span-2" roleColor="info" />
                          </>
                      ) : (
                          <>
                              <CustomDropdown 
                                  label="Assign Class" 
                                  icon={School} 
                                  value={selectedClassId} 
                                  onChange={setSelectedClassId} 
                                  className='w-full'
                                  options={classOptions}
                              />
                              <CustomInput label="Guardian Name" name="student_profile.guardian_name" value={formData.student_profile?.guardian_name} onChange={handleInputChange} icon={HeartHandshake} placeholder="Enter guardian's name" roleColor="primary" />
                              <CustomInput label="Guardian Relation" name="student_profile.guardian_relation" value={formData.student_profile?.guardian_relation} onChange={handleInputChange} icon={Link} placeholder="Enter guardian's relation" roleColor="primary" />
                              <CustomInput label="Guardian Contact" name="student_profile.guardian_contact" value={formData.student_profile?.guardian_contact} onChange={handleInputChange} icon={Phone} placeholder="Enter guardian's contact" roleColor="primary" />
                          </>
                      )}
                  </div>
              </div>
          </div>

          <div className="p-6 border-light/10 flex gap-4 pt-1 bg-transparent">
            <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1 py-3' />
            <FormButton type="submit" isLoading={isLoading} variant={role === 'Teacher' ? 'info' : 'primary'} className='flex-2 py-3'>
                Update {role}
            </FormButton>
          </div>
        </form>
        <DecidePopup />
      </div>
    </Portal>
  );
};