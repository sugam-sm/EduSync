import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export interface UserBase {
    id?: number;
    username?: string;
    email: string;
    role: number;
    role_name: string;
    gender: string;
    is_active: boolean;
    org_name?: string;
    fullname?: string;
}

export interface User extends UserBase {
    first_name: string;
    middle_name: string;
    last_name: string;
    fullname?: string;
    password?: string;
    teacher_profile?: {
        contact_number: string;
        specialization: string;
        qualification: string;
    }
    student_profile?: {
        grade: number;
        grade_name: string;
        section: string;
        academic_year: string;
        guardian_name: string;
        guardian_relation: string;
        guardian_contact: string;
    }
}

export interface UserSummary extends UserBase {
    fullname: string;
    grade?: number;
    teacher_profile?: {
        contact_number: string;
    } | null;
    student_profile?: {
        grade_name: string;
        section: string;
        guardian_relation: string;
        guardian_contact: string;
    } | null;
}

interface UsersState {
    users: UserSummary[];
    selectedUser: User | null;
    isLoading: boolean;
    isDetailsLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: UsersState = {
    users: [],
    selectedUser: null,
    isLoading: false,
    isDetailsLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/users/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to fetch users.");
        }
    }
);

export const fetchUser = createAsyncThunk(
    'users/fetchUser',
    async (userId: number, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/users/${userId}/`);
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch user details');
        }
    }
)

export const createUser = createAsyncThunk(
    'users/createUser',
    async (userData: User, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/users/', userData);
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data || 'failed to create user');
        }
    }
)

export const updateUser = createAsyncThunk(
    'user/updateUser',
    async ({ userId, userData }: { userId: number; userData: User }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/users/${userId}/`, userData);
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data || 'failed to update user')
        }
    }
)

export const deleteUser = createAsyncThunk(
    'user/deleteUser',
    async (userId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/users/${userId}/`)
            return userId;
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data || "failed to delete")
        }
    }
)

export const bulkUploadUsers = createAsyncThunk(
    'users/bulkUpload',
    async (payload: { file: File, role?: string }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', payload.file);
            if (payload.role) {
                formData.append('role', payload.role);
            }
            const response = await api.post('/api/users/bulk_upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Bulk upload failed');
        }
    }
)

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        resetUserState: (state) => {
            state.isLoading = false;
            state.isDetailsLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.selectedUser = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Could not load users.";
            })
            .addCase(fetchUser.pending, (state) => {
                state.isDetailsLoading = true;
                state.selectedUser = null;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.isDetailsLoading = false;
                state.isSuccess = true;
                state.selectedUser = action.payload;
            })
            .addCase(fetchUser.rejected, (state, action: any) => {
                state.isDetailsLoading = false;
                state.isError = true;
                state.message = action.payload?.details || "failed to load user details"
            })
            .addCase(createUser.pending, (state) => {
                state.isDetailsLoading = true;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.isDetailsLoading = false;
                state.isSuccess = true;
                state.users.unshift(action.payload);
            })
            .addCase(createUser.rejected, (state, action: any) => {
                state.isDetailsLoading = false;
                state.isError = true;
                const payload = action.payload;
                const contactError = payload?.teacher_profile?.contact_number;
                const guardianError = payload?.student_profile?.guardian_contact;

                state.message = payload?.detail ||
                    payload?.email?.[0] ||
                    (Array.isArray(contactError) ? contactError[0] : contactError) ||
                    (Array.isArray(guardianError) ? guardianError[0] : guardianError) ||
                    "Validation Error";
            })
            .addCase(updateUser.pending, (state) => {
                state.isDetailsLoading = true;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.isDetailsLoading = false;
                state.isSuccess = true;
                state.users = state.users.map((user) => user.id === action.payload.id ? action.payload : user)
            })
            .addCase(updateUser.rejected, (state, action: any) => {
                state.isDetailsLoading = false;
                state.isError = true;
                const payload = action.payload;
                const contactError = payload?.teacher_profile?.contact_number;
                const guardianError = payload?.student_profile?.guardian_contact;

                state.message = payload?.detail ||
                    payload?.email?.[0] ||
                    (Array.isArray(contactError) ? contactError[0] : contactError) ||
                    (Array.isArray(guardianError) ? guardianError[0] : guardianError) ||
                    "failed to update user";
            })
            .addCase(deleteUser.pending, (state) => {
                state.isDetailsLoading = true;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.isDetailsLoading = false;
                state.isSuccess = true;
                state.users = state.users.filter((user) => user.id !== action.payload)
            })
            .addCase(deleteUser.rejected, (state, action: any) => {
                state.isDetailsLoading = false;
                state.isError = true;
                if (action.error?.message?.includes("404")) {
                    state.message = "User not found or already deleted.";
                } else {
                    state.message = action.payload?.detail || "Delete failed. Please try again.";
                }
            })
            .addCase(bulkUploadUsers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(bulkUploadUsers.fulfilled, (state, action: any) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload?.detail || "Import successful";
            })
            .addCase(bulkUploadUsers.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Bulk upload failed";
            })
    }
});

export const { resetUserState } = userSlice.actions;
export default userSlice.reducer;
