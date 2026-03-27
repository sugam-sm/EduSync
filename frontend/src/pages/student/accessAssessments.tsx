import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, ClipboardCheck, MessageSquare } from "lucide-react";

import { type AppDispatch, type RootState } from "../../store";
import { fetchQuizzes, fetchQuizResults, type Quiz, type QuizResultType } from "../../features/learning/quizSllice";
import { fetchSubjects } from "../../features/organization/subjectSlice";
import { fetchQuizRemarks } from "../../features/learning/teacherRemarkSlice";
import { CustomDropdown } from "../../components/Custom/customDropdown";
import { StudentQuizCard } from "../../components/Cards/student/studentQuizCard";
import { StudentRemarkCard } from "../../components/Cards/student/studentRemarkCard";
import { addToast } from "../../features/toasts/toastSlice";

import { AttemptQuizPopup } from "./view/attemptQuizPopup";
import { ViewQuizResultPopup } from "./view/viewQuizResultPopup";

export const AccessAssessments = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { quizzes, quizResults, isQuizLoading } = useSelector((state: RootState) => state.quiz);
    const { subjects } = useSelector((state: RootState) => state.subject);
    const { existingRemarks: remarks, isLoading: isRemarkLoading } = useSelector((state: RootState) => state.teacherRemark);

    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
    const [sectionMode, setSectionMode] = useState<'quizzes' | 'remarks'>('quizzes');
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [viewResult, setViewResult] = useState<QuizResultType | null>(null);

    useEffect(() => {
        dispatch(fetchSubjects());
        dispatch(fetchQuizResults());
    }, [dispatch]);

    useEffect(() => {
        if (sectionMode === 'quizzes') {
            dispatch(fetchQuizzes({ subject_id: selectedSubject || undefined }));
        } else {
            dispatch(fetchQuizRemarks({ subject_id: selectedSubject || undefined }));
        }
    }, [dispatch, selectedSubject, sectionMode]);

    const handleTakeQuiz = (quiz: Quiz) => {
        if (!quiz.questions || quiz.questions.length === 0) {
            dispatch(addToast({ 
                message: "This quiz is not available yet (no questions found).", 
                type: "info" 
            }));
            return;
        }
        setActiveQuiz(quiz);
    };

    const isLoading = sectionMode === 'quizzes' ? isQuizLoading : isRemarkLoading;

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left tracking-tighter">
                    {sectionMode === 'quizzes' ? 'Access Quizzes' : 'Access Remarks'}
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-3">
                    <div className="flex justify-between w-full xl:w-[53%]">
                        <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                            {sectionMode === 'quizzes' ? <ClipboardCheck size={30} strokeWidth={3} /> : <MessageSquare size={30} strokeWidth={3} />}
                        </div>
                        <div className="flex gap-2 w-[80%] 2xl:w-[50%]">
                            <span className="text-text-muted font-semibold flex items-center">Subject:</span>
                            <CustomDropdown 
                                className="w-full"
                                options={subjects.map(s => ({ value: s.id, label: s.name }))}
                                value={selectedSubject}
                                onChange={setSelectedSubject}
                                placeholder="All Subjects"
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

                <div className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[62.7vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center mt-20">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Loading content...</p>
                        </div>
                    ) : selectedSubject === null ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <div>
                                {sectionMode === 'quizzes' ?
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">Select a Subject</h3>
                                        <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                            Choose a subject from the dropdown above to access quizzes for that subject.
                                        </p>
                                    </>
                                    :
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">Select a Subject</h3>
                                        <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                            Choose a subject from the dropdown above to access remarks for that subject.
                                        </p>
                                    </>
                                }
                            </div>
                        </div>
                    ) : sectionMode === 'quizzes' ? (
                        quizzes.length === 0 ? (
                            <p className="text-center font-bold text-text-muted mt-20 text-lg">No Assessments Found</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-15">
                                {quizzes.map((quiz) => {
                                    const result = quizResults.find(r => r.quiz === quiz.id);
                                    return (
                                        <StudentQuizCard 
                                            key={quiz.id} 
                                            quiz={quiz} 
                                            result={result}
                                            onTakeQuiz={() => handleTakeQuiz(quiz)} 
                                            onViewResult={() => setViewResult(result || null)}
                                        />
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        remarks.length === 0 ? (
                            <p className="text-center font-bold text-text-muted mt-20 text-lg">No Remarks Found</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-15">
                                {remarks.map((remark) => (
                                    <StudentRemarkCard 
                                        key={remark.id} 
                                        remark={remark}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </section>

            {/* View Popups */}
            {activeQuiz && (
                <AttemptQuizPopup 
                    isOpen={!!activeQuiz} 
                    onClose={() => setActiveQuiz(null)} 
                    quiz={activeQuiz} 
                />
            )}

            {viewResult && (
                <ViewQuizResultPopup 
                    isOpen={!!viewResult} 
                    onClose={() => setViewResult(null)} 
                    result={viewResult} 
                    quiz={quizzes.find(q => q.id === viewResult.quiz)} 
                />
            )}
        </div>
    );
};