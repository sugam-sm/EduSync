import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

export interface TeacherQuizRemark {
    id?: number;
    quiz: number;
    quiz_title?: string;
    student: number;
    teacher?: number;
    teacher_name?: string;
    student_name?: string;
    remark_text: string;
    created_at?: string;
}

export interface QuizStudentResult {
    id: number;
    quiz: number;
    quiz_title: string;
    student: number;
    student_id: number;
    student_name: string;
    total_score: number;
    started_at: string;
    completed_at?: string | null;
    status: string;
}

interface TeacherRemarkState {
    studentResults: QuizStudentResult[];
    existingRemarks: TeacherQuizRemark[];
    isLoading: boolean;
    isSubmitting: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: TeacherRemarkState = {
    studentResults: [],
    existingRemarks: [],
    isLoading: false,
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    message: '',
};

export const fetchQuizStudentResults = createAsyncThunk(
    'teacherRemark/fetchQuizStudentResults',
    async (quizId: number, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/analytics/quiz-attempts/quiz_results/`, { params: { quiz_id: quizId } });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch quiz results.');
        }
    }
);

export const fetchQuizRemarks = createAsyncThunk(
    'teacherRemark/fetchQuizRemarks',
    async (params: { quiz_id?: number; subject_id?: number }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/analytics/quiz-remarks/`, { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch remarks.');
        }
    }
);

export const submitBulkRemarks = createAsyncThunk(
    'teacherRemark/submitBulkRemarks',
    async ({ quizId, remarks }: { quizId: number; remarks: { student_id: number; remark_text: string }[] }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/analytics/quiz-remarks/bulk_submit/`, { remarks }, { params: { quiz_id: quizId } });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to submit remarks.');
        }
    }
);

const teacherRemarkSlice = createSlice({
    name: 'teacherRemark',
    initialState,
    reducers: {
        resetTeacherRemarkState: (state) => {
            state.isLoading = false;
            state.isSubmitting = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearTeacherRemarkData: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            // FETCH QUIZ STUDENT RESULTS
            .addCase(fetchQuizStudentResults.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(fetchQuizStudentResults.fulfilled, (state, action: PayloadAction<QuizStudentResult[]>) => {
                state.isLoading = false;
                state.studentResults = action.payload;
            })
            .addCase(fetchQuizStudentResults.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Could not load results.';
            })

            // FETCH EXISTING REMARKS
            .addCase(fetchQuizRemarks.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchQuizRemarks.fulfilled, (state, action: PayloadAction<TeacherQuizRemark[]>) => {
                state.isLoading = false;
                state.existingRemarks = action.payload;
            })
            .addCase(fetchQuizRemarks.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Could not load remarks.';
            })

            // SUBMIT BULK REMARKS
            .addCase(submitBulkRemarks.pending, (state) => {
                state.isSubmitting = true;
                state.isError = false;
            })
            .addCase(submitBulkRemarks.fulfilled, (state, action: PayloadAction<TeacherQuizRemark[]>) => {
                state.isSubmitting = false;
                state.isSuccess = true;
                // Merge submitted remarks into existing
                for (const remark of action.payload) {
                    const idx = state.existingRemarks.findIndex(
                        r => r.quiz === remark.quiz && r.student === remark.student
                    );
                    if (idx !== -1) {
                        state.existingRemarks[idx] = remark;
                    } else {
                        state.existingRemarks.push(remark);
                    }
                }
            })
            .addCase(submitBulkRemarks.rejected, (state, action: any) => {
                state.isSubmitting = false;
                state.isError = true;
                state.message = action.payload || 'Failed to submit remarks.';
            });
    },
});

export const { resetTeacherRemarkState, clearTeacherRemarkData } = teacherRemarkSlice.actions;
export default teacherRemarkSlice.reducer;
