import { MessageSquare, Calendar, User } from "lucide-react";
import { type TeacherQuizRemark } from "../../../features/learning/teacherRemarkSlice";

interface StudentRemarkCardProps {
    remark: TeacherQuizRemark;
}

export const StudentRemarkCard = ({ remark }: StudentRemarkCardProps) => {
    return (
        <div className="relative w-full bg-surface border-2 border-light/10 rounded-xl p-2 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50">
            <div className="flex items-start gap-4 w-full min-w-0">
                <div className="hidden md:block p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <MessageSquare size={24} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-bold text-lg text-primary truncate" title={remark.quiz_title}>
                        {remark.quiz_title || "Quiz Remark"}
                    </h3>
                    <p className="text-text-muted text-[13px] font-medium leading-relaxed italic mb-2">
                        "{remark.remark_text}"
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-widest text-primary/70">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5">
                            <User size={12} />
                            <span>{remark.teacher_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5">
                            <Calendar size={12} />
                            <span>{new Date(remark.created_at || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
