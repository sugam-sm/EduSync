import { useState } from 'react';
import { AtSign, UserRoundPen, UserRoundX, Eye, Mail, Shield, Building2, MoreVertical, X, Award } from "lucide-react";
import { type UserSummary } from '../../../features/organization/userSlice';
import { ActionButton } from '../../Buttons/actionButton';
import { DecisionPopup } from '../../decision popup';
import { useDispatch } from 'react-redux';
import { type AppDispatch } from '../../../store';
import { deleteUser } from '../../../features/organization/userSlice'; 
import { addToast } from '../../../features/toasts/toastSlice';

interface AdministratorCardProps {
  user: UserSummary;
  organizationName?: string;
  onEdit: () => void;
  onView: () => void;
}

export const AdministratorCard = ({ user, organizationName, onEdit, onView }: AdministratorCardProps) => {
  const { openDecidePopup, DecidePopup } = DecisionPopup();
  const dispatch = useDispatch<AppDispatch>();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const isActive = user.is_active !== false;

  const handleDelete = () => {
    openDecidePopup({
      question: `Revoke administrative access for ${user.username}?`,
      confirmText: "Yes, Revoke",
      cancelText: "Cancel",
      variant: 'primary',
      onConfirm: async () => {
        const resultAction = await dispatch(deleteUser(user.id!));
        if (deleteUser.fulfilled.match(resultAction)) {
          dispatch(addToast({
            message: `${user.username} (Admin) record removed`,
            type: 'success'
          }));
        }
      }
    });
  };

  return (
    <div className="relative w-full bg-surface border-2 border-primary/10 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

      {/* Mobile Actions Popup */}
      {isActionsOpen && (
        <div className="md:hidden absolute right-4 top-14 z-20 p-2 bg-surface border-2 border-light/10 rounded-2xl shadow-2xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
          <ActionButton Icon={Eye} variant='custom' onClick={() => {onView(); setIsActionsOpen(false);}} className="p-2!" />
          <ActionButton Icon={UserRoundPen} variant='custom' onClick={() => {onEdit(); setIsActionsOpen(false);}} className="p-2!" />
          <ActionButton Icon={UserRoundX} variant='failure' onClick={() => {handleDelete(); setIsActionsOpen(false);}} className="p-2!" />
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border-2 border-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Shield size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
                <h3 className="uppercase font-bold text-lg leading-tight text-text-heading group-hover:text-primary transition-colors">
                    {user.fullname}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-primary/20">
                        {user.role_name}
                    </span>
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${isActive ? 'bg-success/10 text-success border-success/40' : 'bg-failure/10 text-failure border-failure/40'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-failure'}`}></span>
                        {isActive ? 'Active' : 'Stopped'}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden md:flex gap-1.5">
            <ActionButton Icon={Eye} variant='custom' onClick={onView} className="p-2! bg-bg border-2 border-light/5 hover:border-primary/20" />
            <ActionButton Icon={UserRoundPen} variant='custom' onClick={onEdit} className="p-2! bg-bg border-2 border-light/5 hover:border-primary/20" />
            <ActionButton Icon={UserRoundX} variant='failure' onClick={handleDelete} className="p-2! bg-bg border-2 border-failure/5 hover:border-failure/20" />
          </div>
          
          <button 
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className={`md:hidden hover:cursor-pointer p-2 rounded-xl transition-all duration-300 ${isActionsOpen ? 'bg-failure/10 text-failure' : 'bg-bg border-2 border-light/5 text-text-muted hover:text-text-heading'}`}
          >
            {isActionsOpen ? <X size={20} /> : <MoreVertical size={20} />}
          </button>
        </div>
      </div>

      {/* Organization Info Block */}
      <div className="mb-6 p-4 bg-bg/40 rounded-xl border border-light/5 group-hover:border-primary/10 group-hover:bg-bg/60 transition-all">
          <div className="flex items-center gap-3 text-text-muted mb-1">
              <Building2 size={14} className="text-primary opacity-70" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Controlled Domain</span>
          </div>
          <p className="text-sm font-bold text-text-heading pl-6 truncate">
              {organizationName || "Independent Node"}
          </p>
      </div>

      <div className="grow space-y-3.5 px-1">
        <div className="flex items-center gap-3 text-xs text-text-muted group/info">
          <div className="w-6 h-6 rounded-lg bg-light/5 flex items-center justify-center group-hover/info:bg-primary/10 transition-colors">
            <AtSign size={13} className="opacity-70 group-hover/info:text-primary transition-colors" />
          </div>
          <span className="font-bold tracking-tight opacity-80">{user.username}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted group/info">
          <div className="w-6 h-6 rounded-lg bg-light/5 flex items-center justify-center group-hover/info:bg-primary/10 transition-colors">
            <Mail size={13} className="opacity-70 group-hover/info:text-primary transition-colors" />
          </div>
          <span className="font-bold tracking-tight opacity-80 truncate">{user.email}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted group/info">
          <div className="w-6 h-6 rounded-lg bg-light/5 flex items-center justify-center group-hover/info:bg-primary/10 transition-colors">
            <Award size={13} className="opacity-70 group-hover/info:text-primary transition-colors" />
          </div>
          <span className="font-bold tracking-tight opacity-80">Full Permission Node</span>
        </div>
      </div>

      {/* Footer Visual Bar */}
      <div className="mt-8 h-1 w-full bg-light/5 rounded-full overflow-hidden">
          <div className={`h-full bg-primary/40 rounded-full group-hover:bg-primary transition-all duration-500 w-0 group-hover:w-full tracking-[2px]`} />
      </div>

      <DecidePopup />
    </div>
  );
};
