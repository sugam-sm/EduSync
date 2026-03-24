import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

interface OrganizationDetails {
    id?: number;
    name: string;
    email: string;
    logo?: string | null;
    is_active?: boolean;
}

interface OrganizationState {
    organization: OrganizationDetails | null;
    organizations: OrganizationDetails[];
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: OrganizationState = {
    organization: null,
    organizations: [],
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
}

// fetch the organization data from database
export const fetchOrganization = createAsyncThunk (
    'organization/fetch',
    async (_, thunkAPI) => {
        try {
            const response = await api.get('/api/organizations/me/');
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.detail || 'Failed to load organization data');
        }
    }
)

// List all organizations (for superusers)
export const fetchOrganizations = createAsyncThunk(
    'organization/fetchAll',
    async (_, thunkAPI) => {
        try {
            const response = await api.get('/api/organizations/list/');
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.detail || 'Failed to fetch organizations.');
        }
    }
);

// updating the organization data to database
export const updateOrganization = createAsyncThunk (
    'organization/update',
    async (formData: FormData, thunkAPI) => {
        try {
            const response = await api.patch('api/organizations/me/', formData);
            return response.data;
        } catch (error: any){
            error = error.response?.data
            return thunkAPI.rejectWithValue(error?.email[0] || 'Error')
        }
    }
)

// Update specific organization (for superusers)
export const updateOrganizationById = createAsyncThunk(
    'organization/updateById',
    async ({ id, data }: { id: number; data: any }, thunkAPI) => {
        try {
            const response = await api.patch(`/api/organizations/list/${id}/`, data);
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.detail || 'Failed to update organization.');
        }
    }
);

// Create organization (for superusers)
export const createOrganization = createAsyncThunk(
    'organization/create',
    async (data: any, thunkAPI) => {
        try {
            const response = await api.post('/api/organizations/list/', data);
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.detail || 'Failed to create organization.');
        }
    }
);

// Delete organization (for superusers)
export const deleteOrganization = createAsyncThunk(
    'organization/delete',
    async (id: number, thunkAPI) => {
        try {
            await api.delete(`/api/organizations/list/${id}/`);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.detail || 'Failed to delete organization.');
        }
    }
);

export const organizationSlice = createSlice({
    name: 'organization',
    initialState,
    reducers: {
        resetOrgState: (state) => {
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrganization.pending, (state) => { state.isLoading = true;})
            .addCase(fetchOrganization.fulfilled, (state, action) => {
                state.isLoading = false;
                state.organization = action.payload;
            })
            .addCase(fetchOrganization.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string || "Can't fetch organization details."
            }) 
            .addCase(fetchOrganizations.pending, (state) => { state.isLoading = true; })
            .addCase(fetchOrganizations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.organizations = action.payload;
            })
            .addCase(fetchOrganizations.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string || "Could not load organizations.";
            })
            .addCase(updateOrganization.pending, (state) => { state.isLoading = true})
            .addCase(updateOrganization.fulfilled, ( state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.organization = action.payload;
            })
            .addCase(updateOrganization.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createOrganization.fulfilled, (state, action) => {
                state.organizations.unshift(action.payload);
            })
            .addCase(updateOrganizationById.fulfilled, (state, action) => {
                state.organizations = state.organizations.map(org => org.id === action.payload.id ? action.payload : org);
            })
            .addCase(deleteOrganization.fulfilled, (state, action) => {
                state.organizations = state.organizations.filter(org => org.id !== action.payload);
            });
    },
});

export const { resetOrgState } = organizationSlice.actions;
export default organizationSlice.reducer;
