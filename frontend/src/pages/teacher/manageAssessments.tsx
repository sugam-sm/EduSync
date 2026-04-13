import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, ClipboardCheck, MessageSquareText, ClipboardPlus } from "lucide-react";

import { CardButton } from "../../components/Buttons/cardButton";
import { CustomDropdown } from '../../components/Custom/customDropdown';
import { QuizCard } from "../../components/Cards/teacher/quizCard";
import { BackToTop } from "../../components/Custom/backToTop";

import { CreateQuizPopup } from "./create/createQuizPopup";
import { UpdateQuizPopup } from "./update/updateQuizPopup";
import { CreateQuizWithAIPopup } from "./create/createQuizWithAIPopup";
import { ManageQuiz } from "./manage/manageQuiz";
import { PostQuizEvalPopup } from "./manage/postQuizEvalPopup";

import { type AppDispatch, type RootState } from "../../store";
import { fetchAssignSubs } from "../../features/organization/assignSubjectSlice";
import { type Quiz, fetchQuizzes } from "../../features/learning/quizSlice";

export const ManageAssessments = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { assignSub } = useSelector((state: RootState) => state.assignSub);
    const { quizzes, isLoading: isQuizLoading } = useSelector((state: RootState) => state.quiz);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [selectedSubject, setSelectedSubject] = useState<string | number>("All");
    const [sectionMode, setSectionMode] = useState<'quizzes' | 'remarks'>('quizzes');

    const [isCreateQuizPopupOpen, setIsCreateQuizOpen] = useState(false);
    const [isUpdateQuizPopupOpen, setIsUpdateQuizOpen] = useState(false);
    const [isManageQuestionsOpen, setIsManageQuestionsOpen] = useState(false);
    const [isPostQuizEvalOpen, setIsPostQuizEvalOpen] = useState(false);

    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

    const [isCreateAIOpen, setIsCreateAIOpen] = useState(false);
    const [aiInitialTitle, setAiInitialTitle] = useState('');
    const [aiInitialTime, setAiInitialTime] = useState<number | string>(30);
    const [aiInitialPoints, setAiInitialPoints] = useState<number | string>(1);
    const [aiInitialStart, setAiInitialStart] = useState("");
    const [aiInitialEnd, setAiInitialEnd] = useState("");
    const [createQuizKey, setCreateQuizKey] = useState(0);

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

    // Fetch quizzes when grade + subject are selected
    useEffect(() => {
        if (selectedGrade !== "All" && selectedSubject !== "All") {
            dispatch(fetchQuizzes({ grade: selectedGrade, subject: selectedSubject }));
        }
    }, [dispatch, selectedGrade, selectedSubject]);

    const handleEditQuiz = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsUpdateQuizOpen(true);
    };

    const handleManageQuiz = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsManageQuestionsOpen(true);
    };

    const handleEvaluateQuiz = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsPostQuizEvalOpen(true);
    };

    const isLoading = isQuizLoading;

    return (
        <div className='flex flex-col items-center justify-start h-full w-full relative overflow-hidden p-4'>


            <section className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] mx-auto flex-1 flex flex-col overflow-hidden">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row items-center p-3 gap-4 lg:gap-6">
                    {/* Group 1: Icon + Grade */}
                    <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
                        <div className="text-primary shrink-0">
                            {sectionMode === 'quizzes' ? <ClipboardCheck size={30} strokeWidth={3} /> : <MessageSquareText size={30} strokeWidth={3} />}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-text-muted font-bold text-sm whitespace-nowrap">Grade:</span>
                            <CustomDropdown
                                className="w-full flex-1 h-[45px]"
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                options={gradeOptions}
                                placeholder="Select Grade"
                            />
                        </div>
                    </div>
                    
                    {/* Group 2: Subject */}
                    <div className="flex items-center gap-2 w-full lg:w-auto flex-1">
                        <span className="text-text-muted font-bold text-sm whitespace-nowrap">Subject:</span>
                        <CustomDropdown
                            className="w-full flex-1 h-[45px]"
                            value={selectedSubject}
                            onChange={setSelectedSubject}
                            options={subjectOptions}
                            placeholder="Select Subject"
                        />
                    </div>

                    {/* Group 3: Toggle Buttons */}
                    <div className="flex w-full lg:w-[300px] h-[45px] gap-1 p-1 bg-light/5 rounded-xl border-2 border-light/15 shrink-0">
                        <button
                            type="button"
                            onClick={() => setSectionMode('quizzes')}
                            className={`flex-1 h-full rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'quizzes' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                        >
                            Quizzes
                        </button>
                        <button
                            type="button"
                            onClick={() => setSectionMode('remarks')}
                            className={`flex-1 h-full rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'remarks' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                        >
                            Remarks
                        </button>
                    </div>
                </div>

                <div className="relative mx-auto flex-1 h-0 w-full min-h-[300px] mt-2">
                    <div
                        className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-full overflow-y-auto rounded-2xl custom-scrollbar"
                        ref={scrollRef}
                    >
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Loading...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-15">
                            {sectionMode === 'quizzes' ? (
                                <>
                                    <CardButton
                                        onClick={() => setIsCreateQuizOpen(true)}
                                        Icon={ClipboardPlus}
                                    />
                                    {quizzes.map((quiz) => (
                                        <QuizCard
                                            key={`quiz-${quiz.id}`}
                                            quiz={quiz}
                                            onEdit={handleEditQuiz}
                                            onModify={handleManageQuiz}
                                        />
                                    ))}
                                </>
                            ) : (
                                <>
                                    <div className="w-full mb-2 border-b-2 border-light/5 pb-2 col-span-full">
                                        <h3 className="text-sm font-black text-primary uppercase tracking-widest pl-2 flex items-center gap-2">
                                            <ClipboardCheck size={16} /> Give Remarks
                                        </h3>
                                    </div>
                                    {quizzes.length > 0 ? (
                                        quizzes.map((quiz) => (
                                            <QuizCard
                                                key={`eval-${quiz.id}`}
                                                quiz={quiz}
                                                onEvaluate={handleEvaluateQuiz}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-center font-bold text-text-muted text-sm col-span-full mb-4">No quizzes found.</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    </div>
                    <BackToTop scrollRef={scrollRef} />
                </div>
            </section>

            <CreateQuizPopup
                key={createQuizKey}
                isOpen={isCreateQuizPopupOpen}
                onClose={() => setIsCreateQuizOpen(false)}
                grade={selectedGrade as number}
                subject={selectedSubject as number}
                onSwitchToAI={(title: string, time: number | string, points: number | string, start: string, end: string) => {
                    setIsCreateQuizOpen(false);
                    setAiInitialTitle(title);
                    setAiInitialTime(time);
                    setAiInitialPoints(points);
                    setAiInitialStart(start);
                    setAiInitialEnd(end);
                    setIsCreateAIOpen(true);
                }}
            />

            <CreateQuizWithAIPopup
                isOpen={isCreateAIOpen}
                onClose={() => setIsCreateAIOpen(false)}
                grade={selectedGrade as number}
                subject={selectedSubject as number}
                initialTitle={aiInitialTitle}
                initialTime={aiInitialTime}
                initialPoints={aiInitialPoints}
                initialStart={aiInitialStart}
                initialEnd={aiInitialEnd}
                onBack={() => {
                    setIsCreateAIOpen(false);
                    setIsCreateQuizOpen(true);
                }}
                onDiscard={() => {
                    setCreateQuizKey(prev => prev + 1);
                    setAiInitialTitle('');
                    setAiInitialTime(30);
                    setAiInitialPoints(1);
                    setAiInitialStart('');
                    setAiInitialEnd('');
                }}
            />

            <UpdateQuizPopup
                isOpen={isUpdateQuizPopupOpen}
                onClose={() => { setIsUpdateQuizOpen(false); setSelectedQuiz(null); }}
                quiz={selectedQuiz}
            />

            {selectedQuiz && (
                <ManageQuiz
                    isOpen={isManageQuestionsOpen}
                    onClose={() => { setIsManageQuestionsOpen(false); setSelectedQuiz(null); }}
                    quiz={selectedQuiz}
                />
            )}

            {selectedQuiz && (
                <PostQuizEvalPopup
                    isOpen={isPostQuizEvalOpen}
                    onClose={() => { setIsPostQuizEvalOpen(false); setSelectedQuiz(null); }}
                    quizId={selectedQuiz.id!}
                    quizTitle={selectedQuiz.title}
                    endDatetime={selectedQuiz.end_datetime}
                />
            )}
        </div>
    );
};
