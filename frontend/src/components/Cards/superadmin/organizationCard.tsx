import { Building2, Mail, ExternalLink, PenSquare, Trash2, ShieldCheck } from "lucide-react";
import { ActionButton } from "../../Buttons/actionButton";

interface OrganizationCardProps {
  organization: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const OrganizationCard = ({ organization, onEdit, onDelete }: OrganizationCardProps) => {
  const isActive = organization.is_active !== false;

  return (
    <div className={`relative w-full bg-surface border-2 border-light/10 rounded-2xl p-6 transition-all duration-300 group flex flex-col hover:-translate-y-1 hover:border-primary hover:shadow-md hover:shadow-primary/20`}>
      
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-5">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-2 ${
          isActive 
            ? 'bg-success/10 text-success border-success/30' 
            : 'bg-failure/10 text-failure border-failure/30'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-failure'}`} />
          {isActive ? 'Active' : 'Suspended'}
        </div>

        <div className="flex gap-2">
           <ActionButton Icon={PenSquare} variant='custom' isTeacher={false} onClick={onEdit} className="p-2! bg-primary/10 hover:bg-primary text-primary hover:text-white border-2 border-primary/20 rounded-xl" />
           <ActionButton Icon={Trash2} variant='failure' onClick={onDelete} className="p-2! rounded-xl border-2 border-failure/20" />
        </div>
      </div>

      {/* Main Info */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                {organization.logo ? (
                     <img src={organization.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                    <Building2 size={28} />
                )}
            </div>
            <div className="min-w-0">
                <h3 className="text-xl font-bold text-text-heading tracking-tight leading-tight group-hover:text-primary transition-colors truncate">
                    {organization.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-text-muted text-[10px] font-bold uppercase tracking-widest opacity-70">
                    <ShieldCheck size={10} className="text-primary" /> Authority Hub
                </div>
            </div>
        </div>
      </div>

      {/* Details List */}
      <div className="space-y-3 grow">
        <div className="flex items-center gap-3 p-3 bg-bg/40 rounded-xl border border-light/5 group-hover:bg-bg/60 transition-colors">
          <div className="p-1.5 bg-surface text-primary rounded-lg border border-light/5">
            <Mail size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-60 leading-tight mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Admin Registry</p>
            <p className="text-sm font-bold text-text-body truncate">{organization.email}</p>
          </div>
        </div>
      </div>

      <button onClick={onEdit} className="mt-6 w-full py-3.5 bg-bg border-2 border-light/10 hover:border-primary/40 text-text-muted hover:text-primary rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group/btn hover:cursor-pointer">
          Configuration <ExternalLink size={12} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
      </button>

    </div>
  );
};
