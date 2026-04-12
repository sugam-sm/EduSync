import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api";

export interface SubjectDetails {
    id?: number;
    name: string;
    organization?: string;
    org_name?: string;
}

interface SubjectState {
    subjects: SubjectDetails[];
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    message: string;
}

const initialState: SubjectState = {
    subjects: [],
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: ''
};

export const fetchSubjects = createAsyncThunk(
    'subject/fetchSubjects',
    async (params: { grade?: number | string } | undefined, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/organizations/subjects/', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch subjects.');
        }
    }
);

export const createSubject = createAsyncThunk(
    'subject/createSubject',
    async (subjectData: SubjectDetails, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/organizations/subjects/', subjectData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to create subject.');
        }
    }
);

export const updateSubject = createAsyncThunk(
    'subject/updateSubject',
    async ({ subjectId, subjectData }: { subjectId: number; subjectData: SubjectDetails }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/organizations/subjects/${subjectId}/`, subjectData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to update subject.');
        }
    }
);

export const deleteSubject = createAsyncThunk(
    'subject/deleteSubject',
    async (subjectId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/organizations/subjects/${subjectId}/`);
            return subjectId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to delete subject.");
        }
    }
);

export const bulkUploadSubjects = createAsyncThunk(
    'subject/bulkUpload',
    async (file: File, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/api/organizations/subjects/bulk_upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Bulk upload failed');
        }
    }
);

const subjectSlice = createSlice({
    name: 'subject',
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
            .addCase(fetchSubjects.pending, (state) => { state.isLoading = true; })
            .addCase(fetchSubjects.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.subjects = action.payload;
            })
            .addCase(fetchSubjects.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Could not load subjects.';
            })
            .addCase(createSubject.pending, (state) => { state.isLoading = true; })
            .addCase(createSubject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.subjects.unshift(action.payload);
            })
            .addCase(createSubject.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.name || action.payload?.detail || 'Failed to create subject.';
            })
            .addCase(updateSubject.pending, (state) => { state.isLoading = true; })
            .addCase(updateSubject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subjects = state.subjects.map((s) => s.id === action.payload.id ? action.payload : s);
            })
            .addCase(updateSubject.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Failed to update subject.';
            })
            .addCase(deleteSubject.pending, (state) => { state.isLoading = true; })
            .addCase(deleteSubject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subjects = state.subjects.filter((s) => s.id !== action.payload);
                state.isSuccess = true;
            })
            .addCase(deleteSubject.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Failed to delete subject.';
            })
            .addCase(bulkUploadSubjects.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(bulkUploadSubjects.fulfilled, (state, action: any) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload?.detail || "Import successful";
            })
            .addCase(bulkUploadSubjects.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Bulk upload failed";
            });
    }
});

export const { resetState } = subjectSlice.actions;
export default subjectSlice.reducer;