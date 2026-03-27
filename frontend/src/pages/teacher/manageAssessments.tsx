import { useState, useEffect, useRef } from "react";
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
import { fetchGrades } from "../../features/organization/gradeSlice";
import { type Quiz, fetchQuizzes } from "../../features/learning/quizSllice";

export const ManageAssessments = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { grades } = useSelector((state: RootState) => state.grade);
    const { quizzes, isLoading: isQuizLoading } = useSelector((state: RootState) => state.quiz);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [sectionMode, setSectionMode] = useState<'quizzes' | 'remarks'>('quizzes');

    const [isCreateQuizPopupOpen, setIsCreateQuizOpen] = useState(false);
    const [isUpdateQuizPopupOpen, setIsUpdateQuizOpen] = useState(false);
    const [isManageQuestionsOpen, setIsManageQuestionsOpen] = useState(false);
    const [isPostQuizEvalOpen, setIsPostQuizEvalOpen] = useState(false);

    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

    const [isCreateAIOpen, setIsCreateAIOpen] = useState(false);
    const [aiInitialTitle, setAiInitialTitle] = useState('');
    const [aiInitialTime, setAiInitialTime] = useState<number | string>(30);
    const [aiInitialStart, setAiInitialStart] = useState("");
    const [aiInitialEnd, setAiInitialEnd] = useState("");
    const [createQuizKey, setCreateQuizKey] = useState(0);

    useEffect(() => {
        dispatch(fetchGrades());
    }, [dispatch]);

    // Fetch quizzes when a grade is selected.
    useEffect(() => {
        if (selectedGrade !== "All") {
            dispatch(fetchQuizzes({ grade_id: selectedGrade }));
        }
    }, [dispatch, selectedGrade]);

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

    const gradeOptions = grades.map(grade => ({
        label: `${grade.name} ${grade.section}`,
        value: grade.id!
    }));

    const isLoading = isQuizLoading;

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">
                    Manage {sectionMode === 'quizzes' ? 'Quizzes' : 'Remarks'}
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-3">
                    <div className="flex justify-between w-full xl:w-[53%]">
                        <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                            {sectionMode === 'quizzes' ? <ClipboardCheck size={30} strokeWidth={3}/> : <MessageSquareText size={30} strokeWidth={3}/>}
                        </div>
                        <div className="flex gap-2 w-[80%] 2xl:w-[35%]">
                            <span className="text-text-muted font-semibold flex items-center">Grade:</span>
                            <CustomDropdown
                                className="w-full"
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                options={gradeOptions}
                                placeholder="Select Grade"
                            />
                        </div>
                    </div>
                    <div className="flex w-full 2xl:w-[30%] gap-1 p-1 bg-light/5 rounded-xl border-2 border-light/15">
                        <button
                            type="button"
                            onClick={() => setSectionMode('quizzes')}
                            className={`w-[50%] py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'quizzes' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                        >
                            Quizzes
                        </button>
                        <button
                            type="button"
                            onClick={() => setSectionMode('remarks')}
                            className={`w-[50%] py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'remarks' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                        >
                            Remarks
                        </button>
                    </div>
                </div>

                <div
                    className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[62.7vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto relative"
                    ref={scrollRef}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Loading...</p>
                        </div>
                    ) : selectedGrade === "All" ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <div>
                                {sectionMode === 'quizzes' ?
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">Select a Grade</h3>
                                        <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                            Choose a grade from the dropdown above to manage quizzes for that grade.
                                        </p>
                                    </>
                                    :
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">Select a Grade</h3>
                                        <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                            Choose a grade from the dropdown above to remark students for that grade.
                                        </p>
                                    </>
                                }
                            </div>
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

                    <div className="sticky bottom-0 left-0 w-full flex justify-end p-2 z-50">
                        <BackToTop scrollRef={scrollRef} />
                    </div>
                </div>
            </section>

            <CreateQuizPopup
                key={createQuizKey}
                isOpen={isCreateQuizPopupOpen}
                onClose={() => setIsCreateQuizOpen(false)}
                gradeId={selectedGrade as number}
                onSwitchToAI={(title: string, time: number | string, start: string, end: string) => {
                    setIsCreateQuizOpen(false);
                    setAiInitialTitle(title);
                    setAiInitialTime(time);
                    setAiInitialStart(start);
                    setAiInitialEnd(end);
                    setIsCreateAIOpen(true);
                }}
            />
 
            <CreateQuizWithAIPopup
                isOpen={isCreateAIOpen}
                onClose={() => setIsCreateAIOpen(false)}
                gradeId={selectedGrade as number}
                initialTitle={aiInitialTitle}
                initialTime={aiInitialTime}
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