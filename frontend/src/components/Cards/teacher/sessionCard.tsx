import { Calendar, Clock, BookText, School } from "lucide-react";
import { type Session } from "../../../features/analytics/attendanceSlice";
import { Button } from "../../Buttons/customButton";

interface SessionCardProps {
    session: Session;
    onManage: (session: Session) => void;
    onEnd: (session: Session) => void;
}

export const SessionCard = ({ session, onManage, onEnd }: SessionCardProps) => {
    const startDate = session.start_time ? new Date(session.start_time) : null;
    const dayName = startDate?.toLocaleDateString([], { weekday: 'long' });
    
    return (
        <div className={`relative w-[70%] sm:w-[60%] lg:h-[450px] bg-surface border-3 rounded-xl p-6  hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between hover:shadow-md border-light/40 hover:border-primary hover:shadow-primary/20`}>
            {session.is_active && (
                <div className="absolute top-1 right-1 p-1 bg-primary/50 text-white text-[11.5px] font-semibold px-3 rounded-lg uppercase tracking-widest animate-pulse z-10">
                    Session in progress
                </div>
            )}
            <div className="flex flex-col space-y-6 justify-between items-start w-full">
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`hidden md:block p-3 rounded-xl shrink-0 bg-primary/40 text-primary`}>
                        <BookText size={24} strokeWidth={3}/>
                    </div>
                    <h3 className={`flex flex-col font-bold text-xl truncate text-primary`}>
                        <span className="text-text-muted text-xs uppercase tracking-widest font-black">Subject</span>
                        {session.subject_name}
                    </h3>
                </div>
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`hidden md:block p-3 rounded-xl shrink-0 bg-primary/40 text-primary`}>
                        <School size={24} strokeWidth={3}/>
                    </div>
                    <h3 className={`flex flex-col font-bold text-xl truncate text-primary`}>
                        <span className="text-text-muted text-xs uppercase tracking-widest font-black">Grade</span>
                        {session.grade_name} {session.section}
                    </h3>
                </div>
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`hidden md:block p-3 rounded-xl shrink-0 bg-primary/40 text-primary`}>
                        <Calendar size={24} strokeWidth={3}/>
                    </div>
                    <h3 className={`flex flex-col font-bold text-xl truncate text-primary`}>
                        <span className="text-text-muted text-xs uppercase tracking-widest font-black">Date & Day</span>
                        {startDate?.toLocaleDateString()} {dayName && `- ${dayName}`}
                    </h3>
                </div>
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`hidden md:block p-3 rounded-xl shrink-0 bg-primary/40 text-primary`}>
                        <Clock size={24} strokeWidth={3}/>
                    </div>
                    <h3 className={`flex flex-col font-bold text-xl truncate text-primary`}>
                        <span className="text-text-muted text-xs uppercase tracking-widest font-black">Start Time</span>
                        {startDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h3>
                </div>
            </div>

            <div className="flex self-end w-full sm:w-[60%] gap-4 pt-3 mt-4">
                <Button
                    label="End Session"
                    onClick={() => onEnd(session)}
                    variant="failure"
                    className="flex-1 py-3 font-bold"
                />
                <Button
                    label="Manage"
                    onClick={() => onManage(session)}
                    variant="primary"
                    className="flex-2 py-3 font-bold"
                />
            </div>
        </div>
    );
};
