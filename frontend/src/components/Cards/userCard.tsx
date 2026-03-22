import { useState } from 'react';
import { AtSign, UserRoundPen, UserRoundX, Eye, Mail, Phone, VenusAndMars, MoreVertical, X, School } from "lucide-react";
import { type UserSummary } from '../../features/organization/userSlice';
import { ActionButton } from '../Buttons/actionButton';
import { DecisionPopup } from '../decision popup';
import { useDispatch } from 'react-redux';
import { type AppDispatch } from '../../store';
import { deleteUser } from '../../features/organization/userSlice'; 
import { addToast } from '../../features/toasts/toastSlice';

interface UserCardProps {
  user: UserSummary;
  onEdit: () => void;
  onView: () => void;
}

export const UserCard = ({ user, onEdit, onView }: UserCardProps) => {
  const { openDecidePopup, DecidePopup } = DecisionPopup();
  const dispatch = useDispatch<AppDispatch>();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const isTeacher = user.role_name?.toLowerCase() === 'teacher';
  const isAdmin = user.role_name?.toLowerCase() === 'admin';
  const isActive = user.is_active === true;
  const teacherData = user.teacher_profile;
  const studentData = user.student_profile;

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
            message: `${user.username} deleted successfully`,
            type: 'success'
          }));
        }
      }
    });
  };

  return (
    <div className={`relative w-full bg-surface border-2 border-light/10 rounded-xl p-5 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md ${
        isTeacher 
          ? 'hover:border-info hover:shadow-info/50'
          : 'hover:border-primary hover:shadow-primary/50'
      }`}>
      
      {/* Mobile Popup Overlay */}
      {isActionsOpen && (
        <div className="md:hidden absolute right-2.5 top-10 z-20 p-2 rounded-xl shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
          <ActionButton Icon={Eye} variant='custom' isTeacher={isTeacher} onClick={() => {onView(); setIsActionsOpen(false);}} className="p-2!" />
          <ActionButton Icon={UserRoundPen} variant='custom' isTeacher={isTeacher} onClick={() => {onEdit(); setIsActionsOpen(false);}} className="p-2!" />
          <ActionButton Icon={UserRoundX} variant='failure' onClick={() => {handleDelete(); setIsActionsOpen(false);}} className="p-2!" />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <h3 className={`uppercase font-bold text-lg leading-tight transition-all duration-300 ${isTeacher ? 'text-info' : 'text-primary'}`}>
            {user.fullname}
          </h3>
          
          <div className='flex gap-2 items-center'>
             <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border-2 ${
               isTeacher ? 'bg-info/10 text-info border-info/40' : 'bg-primary/10 text-primary border-primary/40'
             }`}>
               {user.role_name}
             </span>

            <span className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border-2 ${isActive ? 'bg-success/10 text-success border-success/40' : 'bg-failure/10 text-failure border-failure/40'}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-success' : 'bg-failure'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-success' : 'bg-failure'}`}></span>
              </span>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Desktop Buttons & Mobile Toggle */}
        <div className="flex items-center gap-1">
          <div className="hidden md:flex gap-1">
            <ActionButton Icon={Eye} variant='custom' isTeacher={isTeacher} onClick={onView} className="p-2!" />
            <ActionButton Icon={UserRoundPen} variant='custom' isTeacher={isTeacher} onClick={onEdit} className="p-2!" />
            <ActionButton Icon={UserRoundX} variant='failure' onClick={handleDelete} className="p-2!" />
          </div>
          
          <button 
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className={`md:hidden hover:cursor-pointer p-1 rounded-full transition-all duration-300 ${isActionsOpen ? ' text-failure hover:bg-failure/40' : 'hover:bg-light/10 text-text-body'}`}
          >
            {isActionsOpen ? <X size={20} /> : <MoreVertical size={20} />}
          </button>
        </div>
      </div>

      <div className="grow space-y-3 mt-1">
        <div className="flex items-center gap-3 text-[14px] text-text-muted">
          <AtSign size={15} className="opacity-70" />
          <span className="font-medium tracking-wide">{user.username}</span>
        </div>

        <div className="flex items-center gap-3 text-[14px] text-text-muted">
          <Mail size={15} className="opacity-70" />
          <span className="font-medium truncate tracking-wide">{user.email}</span>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-3 text-[14px] text-text-muted">
            <Phone size={15} className="opacity-70" />
            <span className="font-medium tracking-wide">
              {isTeacher ? teacherData?.contact_number : studentData?.guardian_contact}
              {!isTeacher && <span className="ml-1 text-sm opacity-70">({studentData?.guardian_relation})</span>}
            </span>
          </div>
        )}

        {isAdmin && user.org_name && (
          <div className="flex items-center gap-3 text-[14px] text-text-muted">
            <School size={15} className="opacity-70" />
            <span className="font-medium tracking-wide">{user.org_name}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-[14px] text-text-muted">
          <VenusAndMars size={15} className="opacity-70" />
          <span className="font-medium capitalize tracking-wide">{user.gender}</span>
        </div>
      </div>

      <DecidePopup />
    </div>
  );
};