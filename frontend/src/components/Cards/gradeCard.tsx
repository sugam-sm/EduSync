import { Calendar, UserRound, Circle, Pencil, Trash2 } from "lucide-react";
import { ActionButton } from "../Buttons/actionButton";
import { type GradeDetails } from "../../features/organization/gradeSlice"

interface GradeCardProps {
  gradeData: GradeDetails;
  onEdit: () => void;
  onDelete: () => void;
}

export const GradeCard = ({ gradeData, onEdit, onDelete }: GradeCardProps) => {
  const isActive = gradeData.is_active === true;

  return (
    <div className="w-full flex justify-around bg-surface border-3 border-light/10 rounded-xl p-3 hover:-translate-y-1 transition-all duration-300 group shadow-md hover:shadow-primary/50 hover:border-primary">
      <div className="w-[70%] flex flex-col justify-between">
        <div className="grow bg-light/5 border-2 border-light/5 rounded-xl p-3 space-y-4 overflow-clip">
            <div className="flex justify-between items-start">
              <div>
              <h3 className="uppercase font-bold text-xl text-primary transition-all duration-300">
                  {gradeData.name} "{gradeData.section}"
              </h3>
              </div>
              <span className="p-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center">
              <span className={`${isActive ? 'text-success/80' : 'text-failure'} flex items-center gap-2 border-2 rounded-full`}>
                  <Circle size={10} strokeWidth={100} className='rounded-full animate-pulse' />
              </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-muted font-semibold">
              <Calendar size={15} strokeWidth={3} className="text-primary" />
              <span>{gradeData.academic_year}</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted font-semibold">
              <UserRound size={15} strokeWidth={3} className="text-primary" />
              <span>{gradeData.teacher_name || 'Not Assigned'}</span>
            </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 lg:gap-2 justify-center items-center w-[25%]">
        <ActionButton
          Icon={Pencil}
          variant='custom'
          className="lg:w-full h-full"
          onClick={onEdit}
        />
        <ActionButton
          Icon={Trash2}
          variant='failure'
          className="lg:w-full h-full"
          onClick={onDelete}
        />
      </div>
    </div>
  );
};