import { Calendar, Clock, BookText, School, ChevronRight } from "lucide-react";
import { type Session } from "../../../features/analytics/attendanceSlice";
import { Button } from "../../Buttons/customButton";

interface SessionHistoryCardProps {
    session: Session;
    onView: (session: Session) => void;
}

export const SessionHistoryCard = ({ session, onView }: SessionHistoryCardProps) => {
    const startDate = session.start_time ? new Date(session.start_time) : null;
    const endDate = session.end_time ? new Date(session.end_time) : null;
    const dayName = startDate?.toLocaleDateString([], { weekday: 'long' });
    
    // Calculate duration in minutes
    const durationMinutes = startDate && endDate 
        ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
        : null;
    
    return (
        <div className="relative w-full bg-surface/40 border-2 border-light/5 rounded-2xl p-4 hover:border-primary/30 transition-all duration-300 group flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Subject Icon & Title */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                        <BookText size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Subject</span>
                        <h3 className="font-bold text-lg truncate text-text-heading group-hover:text-primary transition-colors">
                            {session.subject_name}
                        </h3>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="h-10 w-px bg-light/10 hidden md:block" />

                {/* Grade Info */}
                <div className="hidden md:flex flex-col min-w-0 w-32">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Grade</span>
                    <div className="flex items-center gap-1.5 text-text-heading font-bold">
                        <School size={14} className="text-primary" />
                        <span className="truncate">{session.grade_name} {session.section}</span>
                    </div>
                </div>

                {/* Date Info */}
                <div className="hidden lg:flex flex-col min-w-0 w-48">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Date & Day</span>
                    <div className="flex items-center gap-1.5 text-text-heading font-bold">
                        <Calendar size={14} className="text-primary" />
                        <span className="truncate">{startDate?.toLocaleDateString()} - {dayName}</span>
                    </div>
                </div>

                {/* Time Info */}
                <div className="hidden xl:flex flex-col min-w-0 w-64">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">
                        Session Time {durationMinutes !== null && `(${durationMinutes}m)`}
                    </span>
                    <div className="flex items-center gap-3 text-text-heading font-bold">
                        <div className="flex items-center gap-1">
                            <Clock size={14} className="text-primary" />
                            <span className="truncate">{startDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-light/20">—</span>
                        <div className="flex items-center gap-1">
                            <Clock size={14} className="text-primary" />
                            <span className="truncate">{endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action */}
            <Button
                label="Details"
                Icon={ChevronRight}
                onClick={() => onView(session)}
                variant="secondary"
                className="px-5 py-2 text-xs font-bold shrink-0"
            />
        </div>
    );
};
