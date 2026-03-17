import { Calendar, UserRound, Pencil, Trash2 } from "lucide-react";
import { ActionButton } from "../Buttons/actionButton";
import { type GradeDetails } from "../../features/organization/gradeSlice";

interface GradeCardProps {
  gradeData: GradeDetails;
  onEdit: () => void;
  onDelete: () => void;
}

export const GradeCard = ({ gradeData, onEdit, onDelete }: GradeCardProps) => {
  const isActive = gradeData.is_active === true;

  return (
    <div className="w-full bg-surface border-3 border-light/10 rounded-xl p-5 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50">
      
      {/* Top Section: Name and Actions */}
      <div className="flex justify-between items-start mb-1">
        <div className="space-y-2">
          <h3 className="uppercase font-bold text-lg leading-tight text-primary transition-all duration-300">
            {gradeData.name} "{gradeData.section}"
          </h3>
          
          {/* Status Badge with Ping */}
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-widest border-2 ${isActive ? 'bg-success/10 text-success border-success/40' : 'bg-failure/10 text-failure border-failure/40'}`}>
            <span className="relative flex h-2 w-2">
              {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-success' : 'bg-failure'}`}></span>
            </span>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>


        {/* Actions positioned Top Right */}
        <div className="flex gap-1">
          <ActionButton Icon={Pencil} variant='custom' onClick={onEdit} className="p-2!" />
          <ActionButton Icon={Trash2} variant='failure' onClick={onDelete} className="p-2!" />
        </div>
      </div>

      {/* Content Section */}
      <div className="grow space-y-3 mt-1">
        <div className="flex items-center gap-3 text-[14px] text-text-muted">
          <Calendar size={15} className="opacity-70 text-primary" />
          <span className="font-medium tracking-wide">{gradeData.academic_year}</span>
        </div>

        <div className="flex items-center gap-3 text-[14px] text-text-muted">
          <UserRound size={15} className="opacity-70 text-primary" />
          <span className="font-medium tracking-wide truncate">
            {gradeData.teacher_name || 'Not Assigned'}
          </span>
        </div>
      </div>

    </div>
  );
};