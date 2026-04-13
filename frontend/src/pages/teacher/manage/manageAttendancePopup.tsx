import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Loader2, CheckCircle2, Users, Clock } from "lucide-react";
import { type AppDispatch, type RootState } from "../../../store";
import { Button } from "../../../components/Buttons/customButton";
import { type Session, markAttendance, fetchGradeStudents } from "../../../features/analytics/attendanceSlice";
import { CustomDropdown } from "../../../components/Custom/customDropdown";

import { addToast } from "../../../features/toasts/toastSlice";

interface ManageAttendancePopupProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session;
}

export const ManageAttendancePopup = ({ isOpen, onClose, session: initialSession }: ManageAttendancePopupProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentStudents, isLoading } = useSelector((state: RootState) => state.attendance);

    // Derived session from store to ensure reactivity when marking attendance
    const sessionFromStore = useSelector((state: RootState) => 
        state.attendance.sessions.find(s => s.id === initialSession.id) || 
        (state.attendance.activeSession?.id === initialSession.id ? state.attendance.activeSession : null)
    );

    const session = sessionFromStore || initialSession;
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        let interval: any;
        if (isOpen && session.is_active && session.start_time) {
            const updateTimer = () => {
                const start = new Date(session.start_time!).getTime();
                const now = new Date().getTime();
                setElapsedTime(Math.max(0, now - start));
            };
            updateTimer();
            interval = setInterval(updateTimer, 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen, session.is_active, session.start_time]);

    useEffect(() => {
        if (isOpen && session.grade) {
            dispatch(fetchGradeStudents(session.grade));
        }
    }, [dispatch, isOpen, session.grade]);

    if (!isOpen) return null;

    const getStudentStatus = (username: string) => {
        return session.attendances?.find(a => a.student_username === username)?.status;
    };

    const handleStatusUpdate = (studentId: number, username: string, status: string) => {
        const currentStatus = getStudentStatus(username);
        if (session.is_active && (currentStatus === 'PRESENT' || currentStatus === 'LATE')) {
            dispatch(addToast({
                message: `The student "${username}" is already marked as ${currentStatus.toLowerCase()}.`,
                type: 'failure'
            }));
            return;
        }

        let finalStatus = status;

        if (session.is_active && status === 'PRESENT' && session.start_time) {
            const now = new Date();
            const start = new Date(session.start_time);
            const diffInMinutes = (now.getTime() - start.getTime()) / 60000;
            if (diffInMinutes > 15) {
                finalStatus = 'LATE';
            }
        }

        dispatch(markAttendance({ session: session.id!, student: studentId, username, status: finalStatus }));
    };

    const statusOptions = [
        { label: 'Present', value: 'PRESENT' },
        { label: 'Late', value: 'LATE' },
        { label: 'Absent', value: 'ABSENT' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="w-full max-w-4xl bg-surface/50 border-2 border-light/10 rounded-4xl shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 pt-6 pb-2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-extrabold text-primary">Manage Attendance</h2>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-0 space-y-5 flex-1">
                    {/* Sub-Banner for Session Info */}
                    <div className="px-2">
                        <div className="p-1.5 rounded-2xl uppercase border border-light/10 text-center font-bold text-md bg-primary/10 text-primary flex items-center justify-center gap-4">
                            <span>{session.subject_name} • Grade {session.grade_name} {session.section} • {session.start_time ? new Date(session.start_time).toLocaleDateString() : 'N/A'}</span>
                            {session.is_active && (
                                <div className="flex items-center gap-1.5 px-3 py-0.5 bg-primary/20 rounded-xl animate-pulse">
                                    <Clock size={16} strokeWidth={3} />
                                    <span className="font-black tabular-nums">{formatDuration(elapsedTime)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                            <Users size={16} />
                            Student List
                        </h3>
                        <div className="p-4 bg-light/5 border-2 border-dashed border-light/10 rounded-3xl overflow-auto h-[45vh]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted opacity-50">
                                    <Loader2 className="animate-spin text-primary" size={40} />
                                    <p className="font-bold tracking-widest uppercase text-xs">Syncing Class List...</p>
                                </div>
                            ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-10">
                                        {currentStudents.map((student) => {
                                            const currentStatus = getStudentStatus(student.username);
                                            return (
                                                <div key={student.username} className="bg-surface border-2 border-light/10 rounded-2xl p-4 flex flex-col gap-2 shadow-sm group hover:border-primary/30 transition-all">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-black text-lg truncate text-primary uppercase group-hover:text-primary transition-colors">{student.fullname}</span>
                                                        <span className="text-sm font-bold text-text-muted uppercase tracking-widest">{student.username}</span>
                                                    </div>

                                                    {session.is_active ? (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => handleStatusUpdate(student.user, student.username, 'PRESENT')}
                                                                label={currentStatus === 'PRESENT' ? 'Present' : currentStatus === 'LATE' ? 'Late' : currentStatus === 'ABSENT' ? 'Absent' : 'Mark Attendance'}
                                                                Icon={CheckCircle2}
                                                                variant={
                                                                    currentStatus === 'PRESENT' ? 'success' :
                                                                    currentStatus === 'LATE' ? 'warning' :
                                                                    currentStatus === 'ABSENT' ? 'failure' :
                                                                    'secondary'
                                                                }
                                                                className={`flex-1 py-1.5 text-xs rounded-xl transition-all ${
                                                                    currentStatus === 'PRESENT' ? 'bg-success text-success' :
                                                                    currentStatus === 'LATE' ? 'bg-warning text-warning' :
                                                                    currentStatus === 'ABSENT' ? 'bg-failure text-failure' :
                                                                    ''
                                                                }`}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Update Status</span>
                                                            <CustomDropdown 
                                                                value={currentStatus || 'ABSENT'}
                                                                options={statusOptions}
                                                                onChange={(val: string | number) => handleStatusUpdate(student.user, student.username, val as string)}
                                                                className="w-full"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 flex gap-2 bg-transparent md:w-[55%] md:ml-auto">
                    <Button
                        label="Done Marking"
                        variant="primary"
                        onClick={onClose}
                        className="flex-1"
                    />
                </div>
            </div>

        </div>
    );
};
