import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api";

export interface AssignSubDetails {
    id?: number;
    subject: number;
    grade: number;
    teacher?: number | null;
    subject_name?: string;
    grade_name?: string;
    grade_section?: string;
    teacher_name?: string;
}

interface AssignSubState {
    assignSub: AssignSubDetails[];
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    message: string;
}

const initialState: AssignSubState = {
    assignSub: [],
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: ''
};

export const fetchAssignSubs = createAsyncThunk(
    'assignSub/fetchAssignSubs',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/organizations/assignments/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch assignments.');
        }
    }
);

export const createAssignSub = createAsyncThunk(
    'assignSub/createAssignSub',
    async (assignSubData: AssignSubDetails, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/organizations/assignments/', assignSubData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to create assignment.');
        }
    }
);

export const updateAssignSub = createAsyncThunk(
    'assignSub/updateAssignSub',
    async ({ id, data }: { id: number; data: AssignSubDetails }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/organizations/assignments/${id}/`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to update assignment.');
        }
    }
);

export const deleteAssignSub = createAsyncThunk(
    'assignSub/deleteAssignSub',
    async (id: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/organizations/assignments/${id}/`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to delete assignment.');
        }
    }
);

const assignSubSlice = createSlice({
    name: 'assignSub',
    initialState,
    reducers: {
        resetAssignSubState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssignSubs.pending, (state) => { state.isLoading = true; })
            .addCase(fetchAssignSubs.fulfilled, (state, action) => {
                state.isLoading = false;
                state.assignSub = action.payload;
            })
            .addCase(fetchAssignSubs.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Failed to fetch assignments.';
            })
            .addCase(createAssignSub.pending, (state) => { state.isLoading = true; })
            .addCase(createAssignSub.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.assignSub.unshift(action.payload);
            })
            .addCase(createAssignSub.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Failed to create assignment.';
            })
            .addCase(updateAssignSub.pending, (state) => { state.isLoading = true; })
            .addCase(updateAssignSub.fulfilled, (state, action) => {
                state.isLoading = false;
                state.assignSub = state.assignSub.map((assign) => assign.id === action.payload.id ? action.payload : assign);
            })
            .addCase(updateAssignSub.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Failed to update assignment.';
            })
            .addCase(deleteAssignSub.pending, (state) => { state.isLoading = true; })
            .addCase(deleteAssignSub.fulfilled, (state, action) => {
                state.isLoading = false;
                state.assignSub = state.assignSub.filter((assign) => assign.id !== action.payload);
            })
            .addCase(deleteAssignSub.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || 'Failed to delete assignment.';
            });
    }
});

export const { resetAssignSubState } = assignSubSlice.actions;
export default assignSubSlice.reducer;