import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export interface DashboardData {
    view: 'student' | 'grade';
    student_name?: string;
    student_id?: number | string;
    grade_name: string;
    subjects: { id: number; name: string }[];
    overall_performance: {
        week: string;
        index: number;
        breakdown: {
            quiz_component: number;
            attendance_component: number;
            sentiment_component: number;
        };
    }[];
    quiz_scores: {
        date: string;
        quiz_title: string;
        score: number;
        max_score: number;
        percentage: number;
        status: string;
        subject: string;
    }[];
    attendance: {
        donut: {
            present: number;
            late: number;
            absent: number;
        };
        timeline: {
            date: string;
            status: string;
            score: number;
            subject: string;
        }[];
    };
    sentiment: {
        date: string;
        quiz_title: string;
        teacher_name: string;
        remark_text: string;
        sentiment_label: string;
        sentiment_score: number;
        subject: string;
    }[];
    class_averages: {
        avg_quiz_percentage: number;
        avg_attendance_score: number;
        avg_edusync_index: number;
    };
    [key: string]: any;
}

interface DashboardState {
    data: DashboardData | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    data: null,
    isLoading: false,
    error: null,
};

export const fetchDashboardData = createAsyncThunk(
    'dashboard/fetchData',
    async (params: { student_id?: string | number; grade?: string | number; subject?: string | number }, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/analytics/dashboard/', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch dashboard data');
        }
    }
);

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        clearDashboardData: (state) => {
            state.data = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDashboardData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.data = action.payload;
            })
            .addCase(fetchDashboardData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
