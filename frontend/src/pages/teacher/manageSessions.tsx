import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, PlayCircle, History, Activity, X } from "lucide-react";
import { type AppDispatch, type RootState } from "../../store";
import { CustomDropdown } from "../../components/Custom/customDropdown";
import { CustomDatePicker } from "../../components/Custom/customDatePicker";
import { BackToTop } from "../../components/Custom/backToTop";
import { CardButton } from "../../components/Buttons/cardButton";
import { SessionCard } from "../../components/Cards/teacher/sessionCard";
import { SessionHistoryCard } from "../../components/Cards/teacher/sessionHistoryCard";
import { ManageAttendancePopup } from "./manage/manageAttendancePopup";
import { StartSessionPopup } from "./create/startSessionPopup";
import {
    fetchSessions,
    endSession,
    type Session
} from "../../features/analytics/attendanceSlice";
import { addToast } from "../../features/toasts/toastSlice";
import { DecisionPopup } from "../../components/decision popup";
import { fetchAssignSubs } from "../../features/organization/assignSubjectSlice";
export const ManageSessions = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const { assignSub } = useSelector((state: RootState) => state.assignSub);
    const { sessions, activeSession, isLoading } = useSelector((state: RootState) => state.attendance);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [selectedSubject, setSelectedSubject] = useState<string | number>("All");
    const [sectionMode, setSectionMode] = useState<'active' | 'history'>('active');
    const [searchDate, setSearchDate] = useState<string>("");


    const [isStartPopupOpen, setIsStartPopupOpen] = useState(false);
    const [isManagePopupOpen, setIsManagePopupOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    // Fetch teacher's assignments once
    useEffect(() => { dispatch(fetchAssignSubs()); }, [dispatch]);

    // Derive unique grades securely from assignments
    const gradeOptions = useMemo(() => {
        const seen = new Map<number, { label: string; value: number }>();
        assignSub.forEach(a => {
            if (a.grade && !seen.has(a.grade)) {
                seen.set(a.grade, { label: `${a.grade_name || ''} ${a.grade_section || ''}`.trim(), value: a.grade });
            }
        });
        return Array.from(seen.values());
    }, [assignSub]);

    // Synchronously derive subjects for the selected grade to prevent UI overlap
    const subjectOptions = useMemo(() => {
        if (selectedGrade === "All") return [];
        const seen = new Map<number, { label: string; value: number }>();
        assignSub.forEach(a => {
            if (a.grade === selectedGrade && a.subject && !seen.has(a.subject)) {
                seen.set(a.subject, { label: a.subject_name || '', value: a.subject });
            }
        });
        return Array.from(seen.values());
    }, [assignSub, selectedGrade]);

    // Auto-select first grade when grades load
    useEffect(() => {
        if (gradeOptions.length > 0 && (selectedGrade === "All" || !gradeOptions.find(g => g.value === selectedGrade))) {
            setSelectedGrade(gradeOptions[0].value);
        }
    }, [gradeOptions, selectedGrade]);

    // Auto-select first subject when specific grade subjects load
    useEffect(() => {
        if (subjectOptions.length > 0) {
            if (!subjectOptions.find(s => s.value === selectedSubject)) {
                setSelectedSubject(subjectOptions[0].value);
            }
        } else {
            setSelectedSubject("All");
        }
    }, [subjectOptions, selectedSubject]);

    // Fetch sessions when grade + subject selected
    useEffect(() => {
        if (selectedGrade !== "All" && selectedSubject !== "All") {
            dispatch(fetchSessions({ grade: selectedGrade, subject: selectedSubject }));
        }
    }, [dispatch, selectedGrade, selectedSubject]);

    const handleManageSession = (session: Session) => {
        setSelectedSession(session);
        setIsManagePopupOpen(true);
    };

    const handleEndSession = (session: Session) => {
        openDecidePopup({
            question: `Do you really want to end the session for "${session.subject_name}"?`,
            confirmText: "Yes, End Session",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: () => {
                dispatch(endSession(session.id!))
                    .unwrap()
                    .then(() => {
                        dispatch(addToast({ message: "Session ended successfully.", type: 'success' }));
                        if (selectedGrade !== "All" && selectedSubject !== "All") {
                            dispatch(fetchSessions({ grade: selectedGrade, subject: selectedSubject }));
                        }
                    })
                    .catch((err) => {
                        dispatch(addToast({ message: typeof err === 'string' ? err : "Failed to end session.", type: 'failure' }));
                    });
            }
        });
    };

    // Filter sessions based on toggle and date
    const filteredSessions = sessions.filter(s => {
        const matchesMode = sectionMode === 'active' ? s.is_active : !s.is_active;
        const matchesDate = !searchDate || (s.start_time && s.start_time.startsWith(searchDate));
        return matchesMode && matchesDate;
    });

    const hasActiveSession = sessions.some(s => s.is_active) || !!activeSession;

    return (
        <div className='flex flex-col items-center justify-start h-full w-full relative overflow-hidden p-4'>


            <section className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] mx-auto flex-1 flex flex-col overflow-hidden relative">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row items-center p-3 gap-4 lg:gap-6">
                    {/* Group 1: Icon + Grade */}
                    <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
                        <div className="text-primary shrink-0">
                            {sectionMode === 'active' ? <Activity size={30} strokeWidth={3} /> : <History size={30} strokeWidth={3} />}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-text-muted font-bold text-sm whitespace-nowrap">Grade:</span>
                            <CustomDropdown
                                className="w-full flex-1 h-11.5"
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                options={gradeOptions}
                            />
                        </div>
                    </div>
                    
                    {/* Group 2: Subject */}
                    <div className="flex items-center gap-2 w-full lg:w-auto flex-1">
                        <span className="text-text-muted font-bold text-sm whitespace-nowrap">Subject:</span>
                        <CustomDropdown
                            className="w-full flex-1 h-11.5"
                            value={selectedSubject}
                            onChange={setSelectedSubject}
                            options={subjectOptions}
                        />
                    </div>

                    {/* Group 3: Toggle Buttons & Date Filter */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
                        <div className="flex w-full sm:w-75 h-11.5 gap-1 p-1 bg-light/5 rounded-xl border-2 border-light/15">
                            <button
                                type="button"
                                onClick={() => setSectionMode('active')}
                                className={`flex-1 h-full rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'active' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                onClick={() => setSectionMode('history')}
                                className={`flex-1 h-full rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'history' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                            >
                                History
                            </button>
                        </div>

                        {sectionMode === 'history' && (
                            <div className="w-full sm:w-auto flex items-center gap-2 relative group">
                                <div className="relative w-full sm:w-auto">
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
                                            className="absolute -top-2 -right-2 p-1.5 bg-failure text-white border-2 border-surface rounded-full hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg z-10"
                                            title="Clear Filter"
                                        >
                                            <X size={12} strokeWidth={4} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative mx-auto flex-1 h-0 w-full min-h-75 mt-2">
                    <div
                        className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-full overflow-y-auto rounded-2xl custom-scrollbar"
                        ref={scrollRef}
                    >
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold tracking-widest uppercase text-xs">Syncing Session Data...</p>
                        </div>
                    ) : (
                        <div className={sectionMode === 'active'
                            ? "flex flex-col items-center justify-center h-full w-full gap-4 m-auto"
                            : "flex flex-col gap-3 pb-15 w-full max-w-5xl mx-auto"
                        }>
                            {/* CardButton only if no active session exists for this teacher */}
                            {sectionMode === 'active' && !hasActiveSession && (
                                <>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-sm text-text-muted mt-2 text-center max-w-sm">
                                            Ready to begin today's session for grade {gradeOptions.find(g => g.value === selectedGrade)?.label}? Start a new session to track attendance and monitor engagement in real-time.
                                        </span>
                                        <CardButton
                                            onClick={() => setIsStartPopupOpen(true)}
                                            Icon={PlayCircle}
                                            className="w-25 h-25 rounded-full"
                                        />
                                    </div>
                                </>
                            )}

                            {filteredSessions.length > 0 ? (
                                filteredSessions.map((session) => (
                                    sectionMode === 'active' ? (
                                        <SessionCard
                                            key={session.id}
                                            session={session}
                                            onManage={handleManageSession}
                                            onEnd={handleEndSession}
                                        />
                                    ) : (
                                        <SessionHistoryCard
                                            key={session.id}
                                            session={session}
                                            onView={handleManageSession}
                                        />
                                    )
                                ))
                            ) : (
                                sectionMode === 'history' && (
                                    <div className="flex flex-col items-center justify-center mt-20 text-text-muted opacity-50">
                                        <History size={60} strokeWidth={1} />
                                        <p className="font-bold mt-2 text-center text-sm">No history found for this grade.</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                    </div>
                    <BackToTop scrollRef={scrollRef} />
                </div>
            </section>

            {/* Popups */}
            <StartSessionPopup
                isOpen={isStartPopupOpen}
                onClose={() => setIsStartPopupOpen(false)}
                grade={selectedGrade as number}
                subject={selectedSubject as number}
            />

            {selectedSession && (
                <ManageAttendancePopup
                    isOpen={isManagePopupOpen}
                    onClose={() => { setIsManagePopupOpen(false); setSelectedSession(null); }}
                    session={selectedSession}
                />
            )}
            <DecidePopup />
        </div>
    );
};
