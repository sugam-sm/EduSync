import { useState, useEffect, useRef } from "react";
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
import { fetchGrades } from "../../features/organization/gradeSlice";
export const ManageSessions = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const { grades } = useSelector((state: RootState) => state.grade);
    const { sessions, activeSession, isLoading } = useSelector((state: RootState) => state.attendance);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [sectionMode, setSectionMode] = useState<'active' | 'history'>('active');
    const [searchDate, setSearchDate] = useState<string>("");


    const [isStartPopupOpen, setIsStartPopupOpen] = useState(false);
    const [isManagePopupOpen, setIsManagePopupOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    useEffect(() => {
        dispatch(fetchGrades());
    }, [dispatch]);

    useEffect(() => {
        if (selectedGrade !== "All") {
            dispatch(fetchSessions({ grade_id: selectedGrade }));
        }
    }, [dispatch, selectedGrade]);

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
                dispatch(endSession(session.id!));
                dispatch(addToast({ message: "Session ended successfully.", type: 'success' }));
            }
        });
    };

    const gradeOptions = grades.map(grade => ({
        label: `${grade.name} ${grade.section}`,
        value: grade.id!
    }));

    // Filter sessions based on toggle and date
    const filteredSessions = sessions.filter(s => {
        const matchesMode = sectionMode === 'active' ? s.is_active : !s.is_active;
        const matchesDate = !searchDate || (s.start_time && s.start_time.startsWith(searchDate));
        return matchesMode && matchesDate;
    });

    const hasActiveSession = sessions.some(s => s.is_active) || !!activeSession;

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">
                    Manage {sectionMode === 'active' ? 'Sessions' : 'History'}
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto relative">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-1 md:gap-3">
                    <div className="flex justify-between items-center w-full xl:w-[53%]">
                        <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                            {sectionMode === 'active' ? <Activity size={30} strokeWidth={3} /> : <History size={30} strokeWidth={3} />}
                        </div>
                        <div className="flex gap-2 w-[80%] 2xl:w-[35%]">
                            <span className="text-text-muted font-bold flex items-center whitespace-nowrap text-sm">Grade:</span>
                            <CustomDropdown
                                className="w-full"
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                options={gradeOptions}
                            />
                        </div>
                    </div>

                    <div className="flex flex-row lg:contents items-center gap-2 w-full lg:w-auto justify-between">
                        <div className={`flex-1 lg:flex-none lg:w-auto xl:min-w-[280px] 2xl:w-[30%] order-1 lg:order-3 flex gap-1 p-1 bg-light/5 rounded-xl border-2 border-light/15`}>
                            <button
                                type="button"
                                onClick={() => setSectionMode('active')}
                                className={`w-[50%] py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'active' ? 'bg-primary/35 text-primary shadow-sm' : 'text-text-muted hover:bg-primary/10'}`}
                            >
                                Live
                            </button>
                            <button
                                type="button"
                                onClick={() => setSectionMode('history')}
                                className={`w-[50%] py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'history' ? 'bg-primary/35 text-primary shadow-sm' : 'text-text-muted hover:bg-primary/10'}`}
                            >
                                History
                            </button>
                        </div>

                        {sectionMode === 'history' && (
                            <div className="w-auto flex items-center gap-2 relative group order-2 lg:order-2">
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
                        )}
                    </div>
                </div>

                <div
                    className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[62.7vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto relative"
                    ref={scrollRef}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold tracking-widest uppercase text-xs">Syncing Session Data...</p>
                        </div>
                    ) : selectedGrade === "All" ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <div>
                                {sectionMode === 'active' ?
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">Select a Grade</h3>
                                        <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                            Choose a grade from the dropdown above to start a session for that grade.
                                        </p>
                                    </>
                                    :
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">Select a Grade</h3>
                                        <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                            Choose a grade from the dropdown above to view attendance history for that grade.
                                        </p>
                                    </>
                                }
                            </div>
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
                                        <span className="text-text-muted font-semibold text-md text-center">Click the button below to start session for grade {grades.find(g => g.id === selectedGrade)?.name} {grades.find(g => g.id === selectedGrade)?.section}</span>
                                        <CardButton
                                            onClick={() => setIsStartPopupOpen(true)}
                                            Icon={PlayCircle}
                                            className="w-[100px] h-[100px] rounded-full"
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

                    <div className="sticky bottom-0 left-0 w-full flex justify-end p-2 z-50">
                        <BackToTop scrollRef={scrollRef} />
                    </div>
                </div>
            </section>

            {/* Popups */}
            <StartSessionPopup
                isOpen={isStartPopupOpen}
                onClose={() => setIsStartPopupOpen(false)}
                gradeId={selectedGrade}
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