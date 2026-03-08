import { AtSign, UserRoundPen, UserRoundX, Eye, Mail, Phone, VenusAndMars, Circle } from "lucide-react";
import { type  UserSummary } from '../../features/management/userSlice';

import { ActionButton } from '../Buttons/actionButton';
import { DecisionPopup } from '../decision popup';

import { useDispatch } from 'react-redux';
import { type AppDispatch } from '../../store';

import { deleteUser } from '../../features/management/userSlice'; 
import { addToast } from '../../features/toasts/toastSlice';

interface UserCardProps {
  user: UserSummary;
  onEdit: () => void;
  onView: () => void;
}

export const UserCard = ({ user, onEdit, onView }: UserCardProps) => {

  const { openDecidePopup, DecidePopup } = DecisionPopup();

  const dispatch = useDispatch<AppDispatch>();
  // Logic Helpers
  const isTeacher = user.role_name?.toLowerCase() === 'teacher';
  const isActive = user.is_active === true;

  const teacherData = user.teacher_profile;
  const studentData = user.student_profile;

  const handleView = () =>  {
    onView();
  }

  const handleUpdate = () => {
    onEdit();
  }

  const handleDelete = () => {
    openDecidePopup({
      question: `Permanently delete ${user.username}?`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      variant: 'primary',
      onConfirm: async () => {
        const resultAction = await dispatch(deleteUser(user.id!));

        if (deleteUser.fulfilled.match(resultAction)) {
          dispatch(addToast({
            message: `${user.role_name} with username ${user.username} deleted successfully`,
            type: 'success'
          }));
        }
      }
    })
  }

  return (
    <div className={`w-full bg-surface border-3 border-light/10 rounded-xl p-3  hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md ${
        isTeacher 
          ? 'hover:border-info hover:shadow-info/50'
          : 'hover:border-primary hover:shadow-primary/50'
      }`}>
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className={` uppercase font-bold text-xl transition-all duration-300 ${
          isTeacher ? 'text-info' : 
          'text-primary'
          } `}
            title={user.fullname}>
            {user.fullname}
          </h3>
        </div>

        <div className='flex gap-1 items-center'>
          {/* Status */}
          <span className={`${isActive ? 'text-success/80' : 'text-failure'} flex items-center border-2 rounded-full w-full h-full `}>
            <Circle size={10} strokeWidth={100} className='rounded-full animate-pulse' />
          </span>
          {/* Role */}
          <span className={`px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider items-center ${
            isTeacher ? 'bg-info/30 text-info border-info/80 border-2' : 
            'bg-primary/20 text-primary border-primary/80 border-2'
          }`}>
            {user.role_name}
          </span>
        </div>
      </div>

      {/* Data Body */}
      <div className="grow bg-light/5 border-2 border-light/5 rounded-xl p-3 mb-2 space-y-4">

        {/* Username */}
        <div className="flex items-center gap-2 text-text-muted font-semibold">
          <AtSign size={15} strokeWidth={ 3 } />
          <span className="text-text-muted">{user.username}</span>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 text-text-muted font-semibold">
          <Mail size={15} strokeWidth={ 3 } />
          <span className="text-text-muted">{user.email}</span>
        </div>

        {/* GuardianContact */}
        {!isTeacher?
          (<div className="flex text-text-muted items-center gap-2">
            <Phone size={ 15 } strokeWidth={ 3 }/>
            <div>
              <span className="font-semibold uppercase text-text-muted">{studentData?.guardian_contact} ({studentData?.guardian_relation})</span>
            </div>
          </div>) : <></>
        }

        {/* Contact NO. */}
        {isTeacher ? (
          <div className="flex items-center gap-2 text-text-muted font-semibold">
            <Phone size={15} strokeWidth={ 3 } />
            <span>{teacherData?.contact_number}</span>
          </div>) : <></>
        }

        {/* Gender */}
        <div className="flex items-center gap-2 text-text-muted font-semibold">
          <VenusAndMars size={15} strokeWidth={ 3 } />
          <span>{user.gender}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 lg:gap-0 lg:flex-row justify-between">
        <ActionButton
          label='View'
          Icon={Eye}
          variant='custom'
           isTeacher = {isTeacher}
          onClick={handleView}
        />
        <ActionButton
          label='Edit'
          Icon={UserRoundPen}
          variant='custom'
           isTeacher = {isTeacher}
          onClick={handleUpdate}
        />
        <ActionButton
          label='Delete'
          Icon={UserRoundX}
          variant='failure'
          onClick={handleDelete}
        />
      </div>
      <DecidePopup />
    </div>
  );
};