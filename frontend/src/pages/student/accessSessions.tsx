import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, History, ClipboardCheck, BookOpen, Clock, X } from "lucide-react";
import { type AppDispatch, type RootState } from "../../store";
import { fetchSessions } from "../../features/analytics/attendanceSlice";
import { fetchSubjects } from "../../features/organization/subjectSlice";
import { CustomDropdown } from "../../components/Custom/customDropdown";
import { CustomDatePicker } from "../../components/Custom/customDatePicker";

export const AccessSessions = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { sessions, isLoading: isSessionsLoading } = useSelector((state: RootState) => state.attendance);
    const { subjects, isLoading: isSubjectsLoading } = useSelector((state: RootState) => state.subject);
    const { user } = useSelector((state: RootState) => state.login);

    const [selectedSubject, setSelectedSubject] = useState<string | number>("All");
    const [searchDate, setSearchDate] = useState<string>("");

    useEffect(() => {
        dispatch(fetchSubjects());
    }, [dispatch]);

    useEffect(() => {
        if (selectedSubject !== "All") {
            dispatch(fetchSessions());
        }
    }, [dispatch, selectedSubject]);

    const subjectOptions = subjects.map((subject) => ({
        label: subject.name,
        value: subject.id!
    }));

    const attendanceRecords = sessions.flatMap(session =>
        (session.attendances || [])
            .filter(attendance => String(attendance.student_name) === String(user?.full_name) || String(attendance.student_username) === String(user?.username))
            .map(attendance => ({
                ...attendance,
                subject_id: session.subject,
                subject_name: session.subject_name || "Unknown Subject",
                teacher_name: session.teacher_name || "Unknown Teacher",
                session_start: session.start_time,
                session_end: session.end_time,
                date: session.start_time ? new Date(session.start_time).toLocaleDateString() : 'N/A'
            }))
    ).filter(record => {
        const matchesSubject = selectedSubject === "All" || record.subject_id === selectedSubject;
        const matchesDate = !searchDate || (record.session_start && record.session_start.startsWith(searchDate));
        return matchesSubject && matchesDate;
    }).sort((a, b) => new Date(b.marked_at || 0).getTime() - new Date(a.marked_at || 0).getTime());

    const isLoading = isSessionsLoading || isSubjectsLoading;

    const formatTime = (isoString?: string) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left tracking-tighter">
                    My Attendance History
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-3">
                    <div className="flex flex-row lg:contents items-center gap-2 w-full lg:w-auto justify-between pr-2">
                        <div className="flex justify-between w-full xl:w-[53%]">
                            <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                                <History size={30} strokeWidth={3} />
                            </div>
                            <div className="flex gap-2 w-[80%] 2xl:w-[50%]">
                                <span className="text-text-muted font-semibold flex items-center">Subject</span>
                                <CustomDropdown
                                    className="w-full"
                                    value={selectedSubject}
                                    onChange={setSelectedSubject}
                                    options={subjectOptions}
                                    placeholder="Select Subject"
                                />
                            </div>
                        </div>

                        <div className="w-auto flex items-center gap-2 relative group md:order-2">
                            <div className="relative">
                                <CustomDatePicker
                                    value={searchDate}
                                    onChange={setSearchDate}
                                />
                                {searchDate && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchDate("");
                                        }}
                                        className="absolute -top-2 -right-2 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 bg-failure text-white border-2 border-surface rounded-full hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg z-10 animate-in zoom-in-50 fade-in duration-200"
                                        title="Clear Filter"
                                    >
                                        <X size={12} strokeWidth={4} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[62.7vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted opacity-50">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold tracking-widest uppercase text-xs">Syncing Attendance History...</p>
                        </div>
                    ) : selectedSubject === "All" ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <BookOpen size={60} className="text-primary opacity-20" />
                            <div>
                                <h3 className="text-2xl font-bold text-primary">Select a Subject</h3>
                                <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                    Choose a subject from the dropdown above to view your attendance history for that subject.
                                </p>
                            </div>
                        </div>
                    ) : (attendanceRecords.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4 opacity-50">
                            <ClipboardCheck size={60} className="text-text-muted" />
                            <h3 className="text-xl font-bold text-text-muted italic text-center">No attendance records found for this subject.</h3>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 pb-10 w-full max-w-5xl mx-auto">
                            {attendanceRecords.map((record, index) => (
                                <div key={index} className="bg-surface/40 border-2 border-light/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between group hover:border-primary/30 transition-all duration-300 gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                            <ClipboardCheck size={20} strokeWidth={2.5} />
                                        </div>

                                        {/* Teacher & Date */}
                                        <div className="flex flex-col min-w-0 w-32 sm:w-40">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Teacher</span>
                                            <h3 className="font-bold text-md truncate text-text-heading group-hover:text-primary transition-colors">
                                                {record.teacher_name}
                                            </h3>
                                            <span className="text-[11px] font-bold text-text-muted mt-0.5">{record.date}</span>
                                        </div>

                                        {/* Vertical Divider */}
                                        <div className="h-10 w-px bg-light/10 hidden lg:block" />

                                        {/* Session Time Range */}
                                        <div className="hidden lg:flex flex-col min-w-0 w-48">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
                                                <History size={10} /> Session Window
                                            </span>
                                            <div className="flex items-center gap-2 text-text-heading font-bold text-sm">
                                                <span>{formatTime(record.session_start)}</span>
                                                <span className="text-light/20">—</span>
                                                <span>{formatTime(record.session_end || undefined)}</span>
                                            </div>
                                        </div>

                                        {/* Vertical Divider */}
                                        <div className="h-10 w-px bg-light/10 hidden lg:block" />

                                        {/* Marked At Info */}
                                        <div className="hidden sm:flex flex-col min-w-0 w-40">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
                                                <Clock size={10} /> Marked At
                                            </span>
                                            <span className="font-bold text-text-heading text-sm whitespace-nowrap">
                                                {formatTime(record.marked_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex flex-row md:flex-col items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-light/5 pt-3 md:pt-0 md:pl-4">
                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter md:hidden">Status:</span>
                                        <div className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest text-center min-w-[100px] ${record.status === 'PRESENT' ? 'bg-success/20 text-success' :
                                                record.status === 'LATE' ? 'bg-info/20 text-info' : 'bg-failure/20 text-failure'
                                            }`}>
                                            {record.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};