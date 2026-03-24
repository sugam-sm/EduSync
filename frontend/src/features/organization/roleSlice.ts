import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export interface Role {
    id: number;
    role_name: string;
}

interface RoleState {
    roles: Role[];
    isLoading: boolean;
    isError: boolean;
    message: string;
}

const initialState: RoleState = {
    roles: [],
    isLoading: false,
    isError: false,
    message: '',
};

export const fetchRoles = createAsyncThunk(
    'role/fetchRoles',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/roles/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch roles.');
        }
    }
);

const roleSlice = createSlice({
    name: 'role',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.isLoading = false;
                state.roles = action.payload;
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export default roleSlice.reducer;
