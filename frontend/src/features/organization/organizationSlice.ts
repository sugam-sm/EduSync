import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

interface OrganizationDetails {
    name: string;
    email: string;
    logo: string | null;
}

interface OrganizationState {
    organization: OrganizationDetails | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: OrganizationState = {
    organization: null,
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
            });
    },
});

export const { resetOrgState } = organizationSlice.actions;
export default organizationSlice.reducer;