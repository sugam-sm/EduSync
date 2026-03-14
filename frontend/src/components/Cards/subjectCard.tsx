import { BookOpen, Pencil, Trash2, Link } from "lucide-react";
import { ActionButton } from "../Buttons/actionButton";
import { type SubjectDetails } from "../../features/organization/subjectSlice";

interface SubjectCardProps {
  subjectData: SubjectDetails;
  onEdit: () => void;
  onDelete: () => void;
  onConfigure: () => void;
}

export const SubjectCard = ({ subjectData, onEdit, onDelete, onConfigure }: SubjectCardProps) => {
  return (
    <div className="w-full flex flex-col gap-2 bg-surface border-3 border-light/10 rounded-2xl p-2 hover:-translate-y-1 transition-all duration-300 group shadow-md hover:shadow-primary/50 hover:border-primary">
      <div className="flex flex-col justify-between">
        <div className="grow bg-light/5 border-2 border-light/5 rounded-xl p-2 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen size={20} strokeWidth={3} className="text-primary" />
          </div>
          <div>
            <h3 className="uppercase sm:text-md font-semibold text-primary group-hover:text-primary transition-all duration-300">
              {subjectData.name}
            </h3>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 justify-center items-center">
        <ActionButton Icon={Pencil} label="Edit" variant='custom' className="lg:w-full h-full" onClick={onEdit} />
        <ActionButton Icon={Link} label="Assign" variant='custom' className="lg:w-full h-full" onClick={onConfigure} />
        <ActionButton Icon={Trash2} label="Delete" variant='failure' className="lg:w-full h-full" onClick={onDelete} />
      </div>
    </div>
  );
};