import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

export interface Choice {
    id?: number;
    question?: number;
    choice_text: string;
    is_correct: boolean;
}

export interface Question {
    id?: number;
    quiz: number;
    question_text: string;
    question_type: 'MCQ';
    points_override: number;
    time_override_seconds?: number | null;
    image?: string | null;
    order: number;
    choices: Choice[];
}

export interface StudentResponse {
    id?: number;
    attempt: number;
    question: number;
    selected_choice: number | null;
    time_taken_seconds: number;
}

export interface QuizAttempt {
    id?: number;
    quiz: number;
    quiz_title?: string;
    student?: number;
    student_name?: string;
    total_score: number;
    started_at: string;
    completed_at?: string | null;
    status: 'in-progress' | 'completed' | 'auto-submitted';
    responses?: StudentResponse[];
}

export type QuizResultType = QuizAttempt;

export interface Quiz {
    id?: number;
    title: string;
    sub_assign: number;
    created_by?: number;
    is_active: boolean;
    is_published: boolean;
    start_datetime?: string | null;
    end_datetime?: string | null;
    default_time_per_question: number;
    default_points_per_question: number;
    created_at?: string;
    questions: Question[];
    questions_count?: number;
    is_ai_generated?: boolean;
}

interface QuizState {
    quizzes: Quiz[];
    quizResults: QuizAttempt[];
    activeAttempt: QuizAttempt | null;
    isLoading: boolean;
    isQuizLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: QuizState = {
    quizzes: [],
    quizResults: [],
    activeAttempt: null,
    isLoading: false,
    isQuizLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

export const fetchQuizzes = createAsyncThunk(
    'quiz/fetchQuizzes',
    async (params: { grade_id?: string | number, subject_id?: string | number } | undefined, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/learning/quizzes/', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch quizzes.');
        }
    }
);

export const createQuiz = createAsyncThunk(
    'quiz/createQuiz',
    async (quizData: Partial<Quiz>, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/learning/quizzes/', quizData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to create quiz.");
        }
    }
);

export const updateQuiz = createAsyncThunk(
    'quiz/updateQuiz',
    async ({ id, data }: { id: number, data: Partial<Quiz> }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/learning/quizzes/${id}/`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to update quiz.");
        }
    }
);

export const deleteQuiz = createAsyncThunk(
    'quiz/deleteQuiz',
    async (quizId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/learning/quizzes/${quizId}/`);
            return quizId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to delete quiz.");
        }
    }
);

export const createQuestion = createAsyncThunk(
    'quiz/createQuestion',
    async (questionData: any, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/learning/questions/', questionData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to add question.");
        }
    }
);

export const updateQuestion = createAsyncThunk(
    'quiz/updateQuestion',
    async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/learning/questions/${id}/`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to update question.");
        }
    }
);

export const deleteQuestion = createAsyncThunk(
    'quiz/deleteQuestion',
    async (questionId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/learning/questions/${questionId}/`);
            return questionId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to delete question.");
        }
    }
);

export const startQuizAction = createAsyncThunk(
    'quiz/startQuiz',
    async (quizId: number, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/analytics/quiz-attempts/start_quiz/`, { quiz: quizId });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to start quiz.");
        }
    }
);

export const submitAnswerAction = createAsyncThunk(
    'quiz/submitAnswer',
    async ({ quizId, data }: { quizId: number, data: { question: number, selected_choice: number | null, time_taken_seconds: number } }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/analytics/quiz-attempts/submit_answer/`, { quiz: quizId, ...data });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to submit answer.");
        }
    }
);

export const finishQuizAction = createAsyncThunk(
    'quiz/finishQuiz',
    async ({ quizId, auto_submitted }: { quizId: number, auto_submitted?: boolean }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/analytics/quiz-attempts/finish_quiz/`, { quiz: quizId, auto_submitted });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to finish quiz.");
        }
    }
);

export const fetchQuizResults = createAsyncThunk(
    'quiz/fetchQuizResults',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/analytics/quiz-attempts/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to fetch quiz results.");
        }
    }
);

const quizSlice = createSlice({
    name: 'quiz',
    initialState,
    reducers: {
        resetQuizState: (state) => {
            state.isLoading = false;
            state.isQuizLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // FETCH QUIZZES
            .addCase(fetchQuizzes.pending, (state) => { state.isLoading = true; state.isError = false; })
            .addCase(fetchQuizzes.fulfilled, (state, action: PayloadAction<Quiz[]>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.quizzes = action.payload;
            })
            .addCase(fetchQuizzes.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Could not load quizzes.";
            })

            // CREATE QUIZ
            .addCase(createQuiz.pending, (state) => { state.isLoading = true; state.isError = false; })
            .addCase(createQuiz.fulfilled, (state, action: PayloadAction<Quiz>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.quizzes.unshift(action.payload);
            })
            .addCase(createQuiz.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to create quiz.";
            })

            // UPDATE QUIZ
            .addCase(updateQuiz.pending, (state) => { state.isLoading = true; state.isError = false; })
            .addCase(updateQuiz.fulfilled, (state, action: PayloadAction<Quiz>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.quizzes = state.quizzes.map(q => q.id === action.payload.id ? action.payload : q);
            })
            .addCase(updateQuiz.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to update quiz.";
            })

            // DELETE QUIZ
            .addCase(deleteQuiz.pending, (state) => { state.isLoading = true; state.isError = false; })
            .addCase(deleteQuiz.fulfilled, (state, action: PayloadAction<number>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.quizzes = state.quizzes.filter(q => q.id !== action.payload);
            })
            .addCase(deleteQuiz.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to delete quiz.";
            })

            // CREATE QUESTION
            .addCase(createQuestion.pending, (state) => { state.isQuizLoading = true; state.isError = false; })
            .addCase(createQuestion.fulfilled, (state, action: PayloadAction<Question>) => {
                state.isQuizLoading = false;
                state.isSuccess = true;
                const quiz = state.quizzes.find(q => q.id === action.payload.quiz);
                if (quiz) {
                    if (!quiz.questions) quiz.questions = [];
                    quiz.questions.push(action.payload);
                }
            })
            .addCase(createQuestion.rejected, (state, action: any) => {
                state.isQuizLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to add question.";
            })

            // UPDATE QUESTION
            .addCase(updateQuestion.pending, (state) => { state.isQuizLoading = true; state.isError = false; })
            .addCase(updateQuestion.fulfilled, (state, action: PayloadAction<Question>) => {
                state.isQuizLoading = false;
                state.isSuccess = true;
                const quiz = state.quizzes.find(q => q.id === action.payload.quiz);
                if (quiz && quiz.questions) {
                    const idx = quiz.questions.findIndex(q => q.id === action.payload.id);
                    if (idx !== -1) quiz.questions[idx] = action.payload;
                }
            })
            .addCase(updateQuestion.rejected, (state, action: any) => {
                state.isQuizLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to update question.";
            })

            // DELETE QUESTION
            .addCase(deleteQuestion.pending, (state) => { state.isQuizLoading = true; state.isError = false; })
            .addCase(deleteQuestion.fulfilled, (state, action: PayloadAction<number>) => {
                state.isQuizLoading = false;
                state.isSuccess = true;
                state.quizzes.forEach(quiz => {
                    if (quiz.questions) {
                        quiz.questions = quiz.questions.filter(q => q.id !== action.payload);
                    }
                });
            })
            .addCase(deleteQuestion.rejected, (state, action: any) => {
                state.isQuizLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to delete question.";
            })

            // START QUIZ
            .addCase(startQuizAction.pending, (state) => { state.isQuizLoading = true; state.isError = false; })
            .addCase(startQuizAction.fulfilled, (state, action: PayloadAction<QuizAttempt>) => {
                state.isQuizLoading = false;
                state.isSuccess = true;
                state.activeAttempt = action.payload;
            })
            .addCase(startQuizAction.rejected, (state, action: any) => {
                state.isQuizLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to start quiz.";
            })

            // SUBMIT ANSWER
            .addCase(submitAnswerAction.fulfilled, (state, action: PayloadAction<StudentResponse>) => {
                if (state.activeAttempt) {
                    if (!state.activeAttempt.responses) state.activeAttempt.responses = [];
                    const idx = state.activeAttempt.responses.findIndex(r => r.question === action.payload.question);
                    if (idx !== -1) {
                        state.activeAttempt.responses[idx] = action.payload;
                    } else {
                        state.activeAttempt.responses.push(action.payload);
                    }
                }
            })

            // FINISH QUIZ
            .addCase(finishQuizAction.pending, (state) => { state.isQuizLoading = true; state.isError = false; })
            .addCase(finishQuizAction.fulfilled, (state, action: PayloadAction<QuizAttempt>) => {
                state.isQuizLoading = false;
                state.isSuccess = true;
                state.activeAttempt = null;
                state.quizResults.push(action.payload);
            })
            .addCase(finishQuizAction.rejected, (state, action: any) => {
                state.isQuizLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to finish quiz.";
            })

            // FETCH QUIZ RESULTS
            .addCase(fetchQuizResults.pending, (state) => { state.isLoading = true; state.isError = false; })
            .addCase(fetchQuizResults.fulfilled, (state, action: PayloadAction<QuizAttempt[]>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.quizResults = action.payload;
            })
            .addCase(fetchQuizResults.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to load quiz results.";
            });
    }
});

export const { resetQuizState } = quizSlice.actions;
export default quizSlice.reducer;