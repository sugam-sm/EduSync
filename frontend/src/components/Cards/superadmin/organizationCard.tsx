import { useState } from 'react';
import { Mail, Edit, Trash2, MoreVertical, X } from "lucide-react";
import { ActionButton } from "../../Buttons/actionButton";

interface OrganizationCardProps {
  organization: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const OrganizationCard = ({ organization, onEdit, onDelete }: OrganizationCardProps) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const isActive = organization.is_active !== false;

  return (
    <div className={`relative w-full bg-surface border-2 border-light/10 rounded-xl p-5 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50`}>
      
      {/* Mobile Popup Overlay */}
      {isActionsOpen && (
        <div className="md:hidden absolute right-2.5 top-10 z-20 p-2 rounded-xl shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
          <ActionButton Icon={Edit} variant='custom' isTeacher={false} onClick={() => {onEdit(); setIsActionsOpen(false);}} className="p-2!" />
          <ActionButton Icon={Trash2} variant='failure' onClick={() => {onDelete(); setIsActionsOpen(false);}} className="p-2!" />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <h3 className="uppercase font-bold text-lg leading-tight transition-all duration-300 text-primary truncate max-w-70 sm:max-w-90 xl:max-w-72.5 2xl:max-w-full">
            {organization.name}
          </h3>
          
          <div className='flex gap-2 items-center flex-wrap'>
             <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border-2 bg-primary/10 text-primary border-primary/40">
               ORG
             </span>

            <span className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border-2 ${isActive ? 'bg-success/10 text-success border-success/40' : 'bg-failure/10 text-failure border-failure/40'}`}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-success' : 'bg-failure'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-success' : 'bg-failure'}`}></span>
              </span>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Desktop Buttons & Mobile Toggle */}
        <div className="flex items-center gap-1">
          <div className="hidden md:flex gap-1 shrink-0">
            <ActionButton Icon={Edit} variant='custom' isTeacher={false} onClick={onEdit} className="p-2!" />
            <ActionButton Icon={Trash2} variant='failure' onClick={onDelete} className="p-2!" />
          </div>
          
          <button 
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className={`md:hidden hover:cursor-pointer p-1 rounded-full transition-all duration-300 shrink-0 ${isActionsOpen ? ' text-failure hover:bg-failure/40' : 'hover:bg-light/10 text-text-body'}`}
          >
            {isActionsOpen ? <X size={20} /> : <MoreVertical size={20} />}
          </button>
        </div>
      </div>

      <div className="grow space-y-3 mt-1">
        <div className="flex items-center gap-3 text-[14px] text-text-muted">
          <Mail size={15} className="shrink-0 opacity-70" />
          <span className="font-medium truncate tracking-wide">{organization.email}</span>
        </div>
        
      </div>
    </div>
  );
};
