import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api";

export interface GradeDetails {
    id?: number;
    name: string;
    section: string;
    academic_year?: string;
    is_active?: boolean;
    organization?: string;
    class_teacher?: number | null;
    teacher_name?: string;
    org_name?: string;
}

interface GradeState {
    grades: GradeDetails[];
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    message: string;
}

const initialState: GradeState = {
    grades: [],
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: ''
};

export const fetchGrades = createAsyncThunk(
    'grade/fetchGrades',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/organizations/grades/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch grades.');
        }
    }
);

export const createGrade = createAsyncThunk(
    'grade/createGrade',
    async (gradeData: GradeDetails, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/organizations/grades/', gradeData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to create grade.');
        }
    }
);

export const updateGrade = createAsyncThunk(
    'grade/updateGrade',
    async ({ gradeId, gradeData }: { gradeId: number; gradeData: GradeDetails }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/organizations/grades/${gradeId}/`, gradeData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to update grade.');
        }
    }
);

export const deleteGrade = createAsyncThunk(
    'grade/deleteGrade',
    async (gradeId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/organizations/grades/${gradeId}/`);
            return gradeId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to delete grade.");
        }
    }
);

export const bulkUploadGrades = createAsyncThunk(
    'grade/bulkUpload',
    async (file: File, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/api/organizations/grades/bulk_upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Bulk upload failed');
        }
    }
);

const gradeSlice = createSlice({
    name: 'grade',
    initialState,
    reducers: {
        resetState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGrades.pending, (state) => { state.isLoading = true; })
            .addCase(fetchGrades.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.grades = action.payload;
            })
            .addCase(fetchGrades.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Could not load grades.';
            })
            .addCase(createGrade.pending, (state) => { state.isLoading = true; })
            .addCase(createGrade.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.grades.unshift(action.payload);
            })
            .addCase(createGrade.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.section || action.payload?.detail || 'Failed to create grade.';
            })
            .addCase(updateGrade.pending, (state) => { state.isLoading = true; })
            .addCase(updateGrade.fulfilled, (state, action) => {
                state.isLoading = false;
                state.grades = state.grades.map((c) => c.id === action.payload.id ? action.payload : c);
            })
            .addCase(updateGrade.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Failed to update.';
            })
            .addCase(deleteGrade.pending, (state) => { state.isLoading = true; })
            .addCase(deleteGrade.fulfilled, (state, action) => {
                state.isLoading = false;
                state.grades = state.grades.filter((c) => c.id !== action.payload);
                state.isSuccess = true;
            })
            .addCase(deleteGrade.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Failed to delete grade.';
            })
            .addCase(bulkUploadGrades.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(bulkUploadGrades.fulfilled, (state, action: any) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload?.detail || "Import successful";
            })
            .addCase(bulkUploadGrades.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Bulk upload failed";
            });
    }
});

export const { resetState } = gradeSlice.actions;
export default gradeSlice.reducer;
