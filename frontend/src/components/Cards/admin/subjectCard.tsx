import { useState, useRef } from 'react';
import { BookOpen, Pencil, Trash2, Link, MoreVertical, X } from "lucide-react";
import { ActionButton } from "../../Buttons/actionButton";
import { type SubjectDetails } from "../../../features/organization/subjectSlice";

interface SubjectCardProps {
  subjectData: SubjectDetails;
  onEdit: () => void;
  onDelete: () => void;
  onConfigure: () => void;
}

export const SubjectCard = ({ subjectData, onEdit, onDelete, onConfigure }: SubjectCardProps) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom');
  const cardRef = useRef<HTMLDivElement>(null);

  const toggleActions = () => {
    if (!isActionsOpen && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      if (window.innerHeight - rect.bottom < 300) {
        setMenuPosition('top');
      } else {
        setMenuPosition('bottom');
      }
    }
    setIsActionsOpen(!isActionsOpen);
  };

  return (
    <div ref={cardRef} className={`relative w-full bg-surface border-3 border-light/10 rounded-xl p-3 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-center hover:shadow-md hover:border-primary hover:shadow-primary/50 ${isActionsOpen ? 'z-20' : 'z-0'}`}>

      {isActionsOpen && (
        <div className={`md:hidden absolute right-0 z-20 bg-surface border border-light/20 p-2 rounded-xl shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 ${menuPosition === 'bottom' ? 'top-[80%]' : 'bottom-[80%]'}`}>
          <ActionButton Icon={Pencil} variant='custom' onClick={() => { onEdit(); setIsActionsOpen(false); }} className="p-2!" />
          <ActionButton Icon={Link} variant='custom' onClick={() => { onConfigure(); setIsActionsOpen(false); }} className="p-2!" />
          <ActionButton Icon={Trash2} variant='failure' onClick={() => { onDelete(); setIsActionsOpen(false); }} className="p-2!" />
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="hidden md:block p-2 bg-primary/10 rounded-lg">
            <BookOpen size={18} strokeWidth={3} className="text-primary" />
          </div>
          <h3 className="uppercase font-bold text-md text-primary transition-all duration-300">
            {subjectData.name}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden md:flex gap-1">
            <ActionButton Icon={Pencil} variant='custom' onClick={onEdit} className="p-2!" />
            <ActionButton Icon={Link} variant='custom' onClick={onConfigure} className="p-2!" />
            <ActionButton Icon={Trash2} variant='failure' onClick={onDelete} className="p-2!" />
          </div>

          <button
            onClick={toggleActions}
            className={`md:hidden hover:cursor-pointer p-1 rounded-full transition-all duration-300 ${isActionsOpen ? 'text-failure hover:bg-failure/20' : 'hover:bg-primary/10 text-primary'}`}
          >
            {isActionsOpen ? <X size={20} strokeWidth={2.5} /> : <MoreVertical size={20} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
};