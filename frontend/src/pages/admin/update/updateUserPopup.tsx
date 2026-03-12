import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, UserRoundPen, GraduationCap, Mail, Phone, 
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
    student_profile: { grade: 0, name: '', section: '', academic_year: '', guardian_name: '', guardian_relation: '', guardian_contact: '' },
    teacher_profile: { contact_number: '', specialization: '', qualification: '' },
  });

  useEffect (() => {
    if (user) {
      setFormData(user);
      setRole(user.role_name === 'Teacher' ? 'Teacher' : 'Student');
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
      Number(selectedClassId) === Number(user?.student_profile?.grade) &&
      formData.student_profile?.guardian_name === user?.student_profile?.guardian_name &&
      JSON.stringify(formData.teacher_profile) === JSON.stringify(user?.teacher_profile);

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
        if (contact.length !== 10 && contact.length !==0){
          dispatch(addToast({ message:"Number should be of 10 digits", type: 'failure' }));
          return;
        }
      } else{
        requiredFields["guardian_name"] = formData.student_profile?.guardian_name;
        requiredFields["relation"] = formData.student_profile?.guardian_relation;
        requiredFields["guardian_contact"] = formData.student_profile?.guardian_contact;
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
      role: role === 'Student' ? 3 : 2,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
        <form onSubmit={handleUpdate} noValidate className="w-full max-w-3xl overflow-hidden">
          
          <div className="flex justify-between items-center p-3 border-2 border-light/10 rounded-3xl bg-surface">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl transition-colors duration-300 ${role === 'Teacher' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>
                  <UserRoundPen size={24} strokeWidth={2.5} />
              </div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${role === 'Teacher' ? 'text-info' : 'text-primary'}`}>Update {role} Details</h2>
            </div>
            <button type="button" onClick={handleClose} className="p-2 hover:bg-failure/10 hover:text-failure text-text-muted rounded-full transition-all duration-300 cursor-pointer hover:rotate-180 ">
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          <div className="px-8 pt-6">
            <div className={`p-3 rounded-2xl uppercase border border-light/10 text-center font-bold text-lg ${role === 'Teacher' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>
                {role}: {user?.username}
            </div>
          </div>

          <div className="p-8 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-4 py-2 border-b border-light/10 pb-4">
                <label className="text-sm font-semibold text-text-muted">Account Status:</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`w-14 h-7 rounded-full transition-colors duration-300 relative ${formData.is_active ? 'bg-success/50' : 'bg-failure'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${formData.is_active ? 'left-8' : 'left-1'}`} />
                </button>
                <span className={`font-bold text-sm ${formData.is_active ? 'text-success' : 'text-failure'}`}>{formData.is_active ? "ACTIVE" : "INACTIVE"}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomInput label="First Name" name="first_name" value={formData.first_name} onChange={handleInputChange} icon={UserRound} placeholder="Enter first name" roleColor={roleColor} />
                  <CustomInput label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleInputChange} placeholder="Enter middle name" roleColor={roleColor} />
                  <CustomInput label="Last Name" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Enter Last name" roleColor={roleColor} />
              </div>

              <div>
                  <CustomInput label="Email Address" name="email" value={formData.email} onChange={handleInputChange} icon={Mail} placeholder="enter email address" type="email" roleColor={roleColor} />
              </div>

              <div className = "grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomDropdown label="Gender" icon={VenusAndMars} value={gender} onChange={setGender} className='w-full' options={['Male', 'Female', 'Other']} />
                <CustomInput label="New Password" name="password" value={password} onChange={(e: any) => setPassword(e.target.value)} icon={KeyRound} placeholder="Type a new password" type="password" roleColor={roleColor} />
              </div>

              <div className="pt-4 border-t border-light/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {role === 'Teacher' ? (
                          <>
                              <CustomInput label="Contact No." name="teacher_profile.contact_number" value={formData.teacher_profile?.contact_number} onChange={handleInputChange} icon={Phone} placeholder="+977" roleColor="info" />
                              <CustomInput label="Specialization" name="teacher_profile.specialization" value={formData.teacher_profile?.specialization} onChange={handleInputChange} icon={BookOpen} placeholder="Subject" roleColor="info" />
                              <CustomInput label="Qualification" name="teacher_profile.qualification" value={formData.teacher_profile?.qualification} onChange={handleInputChange} icon={GraduationCap} placeholder="Degree" className="md:col-span-2" roleColor="info" />
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
                              <CustomInput label="Guardian Name" name="student_profile.guardian_name" value={formData.student_profile?.guardian_name} onChange={handleInputChange} icon={HeartHandshake} placeholder="Name" roleColor="primary" />
                              <CustomInput label="Guardian Relation" name="student_profile.guardian_relation" value={formData.student_profile?.guardian_relation} onChange={handleInputChange} icon={Link} placeholder="Relation" roleColor="primary" />
                              <CustomInput label="Guardian Contact" name="student_profile.guardian_contact" value={formData.student_profile?.guardian_contact} onChange={handleInputChange} icon={Phone} placeholder="Phone" roleColor="primary" />
                          </>
                      )}
                  </div>
              </div>
          </div>

          <div className="p-2 border-2 border-light/5 rounded-3xl flex gap-3 bg-light/5">
            <Button label="Cancel" onClick={handleClose} variant='failure' className='flex-1' />
            <FormButton type="submit" isLoading={isLoading} variant={role === 'Teacher' ? 'info' : 'primary'} className='flex-2'>
                Update {role}
            </FormButton>
          </div>
        </form>
        <DecidePopup />
      </div>
    </Portal>
  );
};