import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

import { Button } from '../../../components/Buttons/customButton';
import { FormButton } from '../../../components/Buttons/formButton';
import { DecisionPopup } from '../../../components/decision popup';
import { Portal } from '../../../components/Portal';
import { CustomInput } from '../../../components/Custom/customInput';

import { type AppDispatch, type RootState } from '../../../store';
import { 
    type Quiz, 
    type Question,
    createQuiz,
    createQuestion, 
    updateQuestion,
    deleteQuestion 
} from '../../../features/learning/quizSllice';
import { addToast } from '../../../features/toasts/toastSlice';

interface ManageQuizProps {
    isOpen: boolean;
    onClose: () => void;
    quiz: Quiz;
    isStepMode?: boolean;
    onBack?: () => void;
    onComplete?: () => void;
}

export const ManageQuiz = ({ 
    isOpen, 
    onClose, 
    quiz, 
    isStepMode = false, 
    onBack, 
    onComplete 
}: ManageQuizProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const currentQuizFromState = useSelector((state: RootState) =>
        state.quiz.quizzes.find(q => q.id === quiz.id)
    );
    
    // Use quiz from props if it's a new quiz (Step Mode), otherwise use from state if available
    const currentQuiz = (isStepMode ? quiz : currentQuizFromState) || quiz;

    const { isQuizLoading } = useSelector((state: RootState) => state.quiz);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    const buildLocalQuestions = useCallback((): Question[] => {
        const existing = (currentQuiz.questions || []).map((q, idx) => ({
            ...q,
            quiz: currentQuiz.id || 0,
            order: q.order ?? idx,
            choices: (q.choices || []).map(c => ({ ...c }))
        }));

        if (existing.length > 0) return existing;

        return [{
            quiz: currentQuiz.id || 0,
            question_text: '',
            question_type: 'MCQ',
            points_override: 1,
            time_override_seconds: currentQuiz.default_time_per_question || 60,
            order: 0,
            choices: [
                { choice_text: '', is_correct: true },
                { choice_text: '', is_correct: false },
            ],
        }];
    }, [currentQuiz]);

    const [questions, setQuestions] = useState<Question[]>(buildLocalQuestions());
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Sync if quiz changes (e.g. initial load)
    useEffect(() => {
        setQuestions(buildLocalQuestions());
    }, [buildLocalQuestions]);

    // Ensure selectedIndex is always valid if questions change
    useEffect(() => {
        if (selectedIndex >= questions.length && questions.length > 0) {
            setSelectedIndex(Math.max(0, questions.length - 1));
        }
    }, [questions.length, selectedIndex]);

    const isDirty = useMemo(() => {
        return JSON.stringify(questions) !== JSON.stringify(buildLocalQuestions());
    }, [questions, buildLocalQuestions]);

    const addNewQuestion = () => {
        setQuestions([...questions, {
            quiz: currentQuiz.id || 0,
            question_text: '',
            question_type: 'MCQ',
            points_override: 1,
            time_override_seconds: currentQuiz.default_time_per_question || 60,
            order: questions.length,
            choices: [
                { choice_text: '', is_correct: true },
                { choice_text: '', is_correct: false },
            ],
        }]);
        setSelectedIndex(questions.length);
    };

    const removeQuestion = () => {
        if (questions.length === 1) {
            dispatch(addToast({ message: "You must have at least one question.", type: 'info' }));
            return;
        }
        const newQuestions = questions.filter((_, idx) => idx !== selectedIndex);
        setQuestions(newQuestions);
        setSelectedIndex(Math.max(0, selectedIndex - 1));
        dispatch(addToast({ message: "Question removed locally.", type: 'success' }));
    };

    const updateField = (field: keyof Question, value: any) => {
        if (!questions[selectedIndex]) return;
        const newQuestions = [...questions];
        newQuestions[selectedIndex] = { ...newQuestions[selectedIndex], [field]: value };
        setQuestions(newQuestions);
    };

    const updateChoiceText = (choiceIdx: number, text: string) => {
        if (!questions[selectedIndex]) return;
        const newQuestions = [...questions];
        const q = { ...newQuestions[selectedIndex] };
        q.choices = q.choices.map((c, idx) => idx === choiceIdx ? { ...c, choice_text: text } : c);
        newQuestions[selectedIndex] = q;
        setQuestions(newQuestions);
    };

    const setCorrectChoice = (choiceIdx: number) => {
        if (!questions[selectedIndex]) return;
        const newQuestions = [...questions];
        const q = { ...newQuestions[selectedIndex] };
        q.choices = q.choices.map((c, idx) => ({ ...c, is_correct: idx === choiceIdx }));
        newQuestions[selectedIndex] = q;
        setQuestions(newQuestions);
    };

    const addChoice = () => {
        if (!questions[selectedIndex]) return;
        if (questions[selectedIndex].choices.length >= 4) {
            dispatch(addToast({ message: "Max 4 choices allowed.", type: 'info' }));
            return;
        }
        const newQuestions = [...questions];
        newQuestions[selectedIndex].choices = [...newQuestions[selectedIndex].choices, { choice_text: '', is_correct: false }];
        setQuestions(newQuestions);
    };

    const removeChoice = (idx: number) => {
        if (!questions[selectedIndex]) return;
        if (questions[selectedIndex].choices.length <= 2) {
            dispatch(addToast({ message: "Min 2 choices required.", type: 'info' }));
            return;
        }
        const newQuestions = [...questions];
        newQuestions[selectedIndex].choices = newQuestions[selectedIndex].choices.filter((_, i) => i !== idx);
        setQuestions(newQuestions);
    };

    const validate = () => {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question_text.trim()) {
                setSelectedIndex(i);
                dispatch(addToast({ message: `Question ${i + 1} is empty.`, type: 'info' }));
                return false;
            }
            if (q.choices.some(c => !c.choice_text.trim())) {
                setSelectedIndex(i);
                dispatch(addToast({ message: `Question ${i + 1} has empty choices.`, type: 'info' }));
                return false;
            }
            if (!q.choices.some(c => c.is_correct)) {
                setSelectedIndex(i);
                dispatch(addToast({ message: `Question ${i + 1} needs a correct answer.`, type: 'info' }));
                return false;
            }
        }
        return true;
    };

    const saveChanges = async () => {
        if (!isDirty && !isStepMode) {
            dispatch(addToast({ message: "No changes detected.", type: 'info' }));
            return;
        }

        if (!validate()) return;

        openDecidePopup({
            question: isStepMode ? "Finalize this quiz and build it?" : "Save changes to this assessment?",
            confirmText: isStepMode ? "Yes, Finalize" : "Yes, Save",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                try {
                    if (isStepMode && !currentQuiz.id) {
                        // Creation flow: first create the quiz, then create each question
                        const quizPayload = { ...currentQuiz };
                        delete (quizPayload as any).questions; 
                        const result = await dispatch(createQuiz(quizPayload as any));
                        if (!createQuiz.fulfilled.match(result)) {
                            dispatch(addToast({ message: "Failed to create quiz.", type: 'failure' }));
                            return;
                        }
                        const createdQuizId = (result.payload as any).id;

                        // Create each question in order
                        for (let i = 0; i < questions.length; i++) {
                            const q = questions[i];
                            const qResult = await dispatch(createQuestion({ ...q, quiz: createdQuizId, order: i }));
                            if (!createQuestion.fulfilled.match(qResult)) {
                                dispatch(addToast({ message: `Failed to save question ${i + 1}. Quiz was created but may be incomplete.`, type: 'failure' }));
                                return;
                            }
                        }

                        dispatch(addToast({ message: "Assessment created successfully!", type: 'success' }));
                        if (onComplete) onComplete();
                        else onClose();
                        return;
                    }

                    const quizId = currentQuiz.id;
                    if (!quizId) throw new Error("Quiz ID missing.");

                    // Sequential processing for editing existing quiz
                    const existingIds = (currentQuiz.questions || []).map(q => q.id).filter(Boolean);
                    const currentIds = questions.map(q => q.id).filter(Boolean);
                    
                    // Delete removed questions
                    for (const id of existingIds) {
                        if (!currentIds.includes(id)) {
                            await dispatch(deleteQuestion(id!));
                        }
                    }

                    // Update or Create
                    for (let i = 0; i < questions.length; i++) {
                        const q = questions[i];
                        const payload = { ...q, order: i, quiz: quizId };
                        
                        if (q.id) {
                            await dispatch(updateQuestion({ id: q.id, data: payload }));
                        } else {
                            await dispatch(createQuestion(payload));
                        }
                    }

                    dispatch(addToast({ message: "Assessment questions synchronized!", type: 'success' }));
                    if (onComplete) onComplete();
                    else onClose();
                } catch (error: any) {
                    dispatch(addToast({ message: "Failed to sync questions.", type: 'failure' }));
                }
            }
        });
    };

    if (!isOpen) return null;

    const currentQuestion = questions[selectedIndex] || questions[0] || null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm">
                <div className="w-full m-auto md:w-[90%] lg:w-[70%] xl:w-[65%] 2xl:w-[50%] h-[70vh] flex border-light/40 border-2 rounded-2xl overflow-hidden bg-surface">
                    
                    {/* SideBar (Aligned with Flashcards) */}
                    <div className="w-16 flex flex-col gap-2 p-2 max-h-full">
                        {/* Quiz Title */}
                        <span className='[writing-mode:vertical-rl] rotate-180 text-primary flex items-center justify-center text-center font-bold border-2 border-primary bg-primary/10 rounded-xl flex-1 uppercase tracking-widest text-[12px]'>
                            {currentQuiz.title}
                        </span>

                        {/* Question Navigation */}
                        <div className='overflow-y-auto min-h-0 space-y-1.5 border-2 border-primary bg-primary/10 p-1 rounded-xl flex-2 scrollbar-hide'>
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`w-full aspect-square shrink-0 rounded-lg border-2 flex items-center justify-center font-bold transition-all ${
                                        selectedIndex === idx
                                        ? 'border-primary bg-primary text-light'
                                        : 'border-primary/40 text-text-muted hover:border-primary/70 hover:text-primary'
                                    } hover:cursor-pointer`}
                                >
                                    {idx + 1}
                                </button>
                            ))}

                            <button
                                onClick={addNewQuestion}
                                className="w-full aspect-square shrink-0 rounded-lg border-2 border-dashed border-light/20 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all hover:cursor-pointer"
                            >
                                <Plus size={20} />
                            </button>
                        </div>                        
                    </div>

                    {/* Editor Content */}
                    <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center p-4 pb-2">
                            <h2 className="text-xl font-bold text-primary">Question {selectedIndex + 1}</h2>
                            
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() =>
                                        openDecidePopup({
                                            question: "Delete this question?",
                                            confirmText: "Yes, Delete",
                                            cancelText: "Cancel",
                                            variant: "primary",
                                            onConfirm: removeQuestion
                                        })
                                    }
                                    className="p-2 hover:bg-failure/10 hover:cursor-pointer text-text-muted hover:text-failure rounded-full transition-all"
                                >
                                    <Trash2 size={20} strokeWidth={2.5} />
                                </button>
                                
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-failure/20 hover:text-failure rounded-full transition-all duration-300 text-text-muted hover:cursor-pointer hover:rotate-90"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-4 flex flex-col gap-4 w-full m-auto overflow-auto scrollbar-hide">
                            <div className="flex-1 flex flex-col gap-6 w-[95%] sm:w-[85%] h-full m-auto">
                                
                                {/* Question Prompt */}
                                <div className="space-y-2">
                                    <textarea
                                        className="w-full min-h-[100px] text-text-body bg-light/5 border-2 border-light/10 rounded-2xl p-4 focus:border-primary focus:text-primary outline-none resize-none transition-all duration-300 placeholder:text-text-muted font-bold"
                                        value={currentQuestion?.question_text || ''}
                                        onChange={(e) => updateField('question_text', e.target.value)}
                                        placeholder="Enter Question Prompt"
                                    />
                                </div>

                                {/* Choices Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {currentQuestion?.choices?.map((choice, cIdx) => (
                                        <div 
                                            key={cIdx} 
                                            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all group ${
                                                choice.is_correct 
                                                ? 'bg-primary/10 border-primary shadow-sm shadow-primary/20' 
                                                : 'bg-light/3 border-light/10 hover:border-primary/40'
                                            }`}
                                        >
                                            <button 
                                                onClick={() => setCorrectChoice(cIdx)}
                                                className={`transition-all ${choice.is_correct ? 'text-primary scale-110' : 'text-text-muted hover:text-primary'}`}
                                            >
                                                {choice.is_correct ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                            </button>

                                            <input 
                                                value={choice.choice_text}
                                                onChange={(e) => updateChoiceText(cIdx, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + cIdx)}`}
                                                className="flex-1 bg-transparent text-sm font-bold text-text-heading outline-none placeholder:text-text-muted"
                                            />

                                            <button 
                                                onClick={() => removeChoice(cIdx)}
                                                className="p-1 hover:bg-failure/10 text-failure rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ))}
                                    {currentQuestion?.choices && currentQuestion.choices.length < 4 && (
                                        <button 
                                            onClick={addChoice}
                                            className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-light/20 text-text-muted hover:border-primary hover:text-primary transition-all font-bold text-sm"
                                        >
                                            <Plus size={18} /> Add Choice
                                        </button>
                                    )}
                                </div>

                                {/* Overrides */}
                                <div className="grid grid-cols-2 gap-4">
                                    <CustomInput 
                                        label="Points Override" 
                                        type="number"
                                        value={currentQuestion?.points_override === undefined || currentQuestion?.points_override === null ? "" : currentQuestion?.points_override} 
                                        onChange={(e: any) => updateField('points_override', e.target.value === "" ? null : Number(e.target.value))} 
                                        roleColor="primary"
                                        placeholder="Default 1"
                                    />
                                    <CustomInput 
                                        label="Time Override (Sec)" 
                                        type="number"
                                        value={currentQuestion?.time_override_seconds === undefined || currentQuestion?.time_override_seconds === null ? "" : currentQuestion?.time_override_seconds} 
                                        onChange={(e: any) => updateField('time_override_seconds', e.target.value === "" ? null : Number(e.target.value))} 
                                        roleColor="primary"
                                        placeholder="Default 30"
                                    />
                                </div>
                            </div>

                            {/* Footer (Aligned with Flashcards) */}
                            <div className="w-full flex justify-end mt-4">
                                <div className='w-full sm:w-[60%] flex gap-2'>
                                    {isStepMode && onBack ? (
                                        <Button label="Back" onClick={onBack} variant='failure' className='flex-1 py-3' />
                                    ) : (
                                        <Button label="Cancel" onClick={onClose} variant='failure' className='flex-1 py-3' />
                                    )}
                                    <FormButton 
                                        onClick={saveChanges} 
                                        isLoading={isQuizLoading} 
                                        variant='primary' 
                                        className='flex-2 py-3'
                                    >
                                        {isStepMode ? "Finalize Quiz" : "Save Changes"}
                                    </FormButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DecidePopup />
            </div>
        </Portal>
    );
};

export default ManageQuiz;
