import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

export interface Attendance {
    id?: number;
    session: number;
    student: number;
    student_name?: string;
    student_username?: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT';
    marked_at?: string;
}

export interface Session {
    id?: number;
    teacher: number;
    teacher_name?: string;
    grade: number;
    grade_name?: string;
    section?: string;
    subject: number;
    subject_name?: string;
    start_time?: string;
    end_time?: string | null;
    is_active: boolean;
    attendances?: Attendance[];
}

interface AttendanceState {
    sessions: Session[];
    activeSession: Session | null;
    currentStudents: any[]; // Student has fullname, user (id), etc.
    isLoading: boolean;
    isAttendanceLoading: boolean;
    isError: boolean;
    message: string;
}

const initialState: AttendanceState = {
    sessions: [],
    activeSession: null,
    currentStudents: [],
    isLoading: false,
    isAttendanceLoading: false,
    isError: false,
    message: '',
};

export const fetchSessions = createAsyncThunk(
    'attendance/fetchSessions',
    async (params: { grade_id?: string | number } | undefined, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/analytics/sessions/', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch sessions.');
        }
    }
);

export const startSession = createAsyncThunk(
    'attendance/startSession',
    async (sessionData: { grade: number, subject: number }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/analytics/sessions/', sessionData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to start session.');
        }
    }
);

export const endSession = createAsyncThunk(
    'attendance/endSession',
    async (sessionId: number, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/analytics/sessions/${sessionId}/end/`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to end session.');
        }
    }
);

export const markAttendance = createAsyncThunk(
    'attendance/markAttendance',
    async (attendanceData: { session: number, student?: number, username?: string, status?: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/analytics/attendance/', attendanceData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to mark attendance.');
        }
    }
);

export const fetchGradeStudents = createAsyncThunk(
    'attendance/fetchGradeStudents',
    async (gradeId: number | string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/students/?grade_id=${gradeId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch students.');
        }
    }
);

const attendanceSlice = createSlice({
    name: 'attendance',
    initialState,
    reducers: {
        resetAttendanceState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        },
        setActiveSession: (state, action: PayloadAction<Session | null>) => {
            state.activeSession = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // FETCH SESSIONS
            .addCase(fetchSessions.pending, (state) => { state.isLoading = true; })
            .addCase(fetchSessions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessions = action.payload;
                state.activeSession = action.payload.find((s: Session) => s.is_active) || null;
            })
            .addCase(fetchSessions.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // START SESSION
            .addCase(startSession.fulfilled, (state, action) => {
                state.sessions.unshift(action.payload);
                state.activeSession = action.payload;
            })
            // END SESSION
            .addCase(endSession.fulfilled, (state, action) => {
                state.sessions = state.sessions.map(s => s.id === action.payload.id ? action.payload : s);
                state.activeSession = null;
            })
            // MARK ATTENDANCE
            .addCase(markAttendance.pending, (state) => { state.isAttendanceLoading = true; })
            .addCase(markAttendance.fulfilled, (state, action) => {
                state.isAttendanceLoading = false;
                // Update active session if it matches
                if (state.activeSession && state.activeSession.id === action.payload.session) {
                    if (!state.activeSession.attendances) state.activeSession.attendances = [];
                    const existing = state.activeSession.attendances.findIndex(a =>
                        (action.payload.student_username && a.student_username === action.payload.student_username) ||
                        (a.student === action.payload.student)
                    );
                    if (existing !== -1) {
                        state.activeSession.attendances[existing] = action.payload;
                    } else {
                        state.activeSession.attendances.push(action.payload);
                    }
                }
                // Update in sessions history array
                const sessionIndex = state.sessions.findIndex(s => s.id === action.payload.session);
                if (sessionIndex !== -1) {
                    if (!state.sessions[sessionIndex].attendances) state.sessions[sessionIndex].attendances = [];
                    const attIndex = state.sessions[sessionIndex].attendances!.findIndex(a =>
                        (action.payload.student_username && a.student_username === action.payload.student_username) ||
                        (a.student === action.payload.student)
                    );
                    if (attIndex !== -1) {
                        state.sessions[sessionIndex].attendances![attIndex] = action.payload;
                    } else {
                        state.sessions[sessionIndex].attendances!.push(action.payload);
                    }
                }
            })
            // FETCH STUDENTS
            .addCase(fetchGradeStudents.pending, (state) => { state.isLoading = true; })
            .addCase(fetchGradeStudents.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentStudents = action.payload;
            });
    }
});

export const { resetAttendanceState, setActiveSession } = attendanceSlice.actions;
export default attendanceSlice.reducer;
