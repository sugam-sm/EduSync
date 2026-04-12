import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export interface Resource {
    id?: number;
    title: string;
    type: 'FILE' | 'LINK';
    folder: number;
    file?: string | null;
    url?: string | null;
    uploaded_at?: string;
}

export interface ResourceFolder {
    id?: number;
    name: string;
    sub_assign: number;
    uploaded_by?: number;
    uploaded_at?: string;
    resources: Resource[];
}

interface ResourceState {
    folders: ResourceFolder[];
    isLoading: boolean;
    isResourceLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: ResourceState = {
    folders: [],
    isLoading: false,
    isResourceLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
}

// Resource Folders thunks
export const fetchResourceFolders = createAsyncThunk(
    'resource/fetchFolders',
    async (params: { grade?: string | number, subject?: string | number } | undefined, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/learning/resourcefolders/', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'failed to fetch resource folders.');
        }
    }
);

export const createResourceFolder = createAsyncThunk(
    'resource/createFolder',
    async (folderData: Partial<ResourceFolder>, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/learning/resourcefolders/', folderData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.grade || error.response?.data?.sub_assign || "Failed to create folder.");
        }
    }
);

export const updateResourceFolder = createAsyncThunk(
    'resource/updateFolder',
    async ({ folderId, folderData }: { folderId: number; folderData: Partial<ResourceFolder> }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/learning/resourcefolders/${folderId}/`, folderData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to update folder.");
        }
    }
);

export const deleteResourceFolder = createAsyncThunk(
    'resource/deleteFolder',
    async (folderId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/learning/resourcefolders/${folderId}/`);
            return folderId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to delete folder.");
        }
    }
);

export const fetchFolderResources = createAsyncThunk(
    'resource/fetchFolderResources',
    async (folderId: number, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/learning/resourcefolders/${folderId}/`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to fetch resources.");
        }
    }
);

// Resources Thunks
export const createResource = createAsyncThunk(
    'resource/createResource',
    async (resourceData: FormData, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/learning/resources/', resourceData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to upload resource.");
        }
    }
);

export const deleteResource = createAsyncThunk(
    'resource/deleteResource',
    async (resourceId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/learning/resources/${resourceId}/`);
            return resourceId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to delete resource.");
        }
    }
);

// Slice for Resource and Resource Folders
const resourceSlice = createSlice({
    name: 'resource',
    initialState,
    reducers: {
        resetResourceState: (state) => {
            state.isLoading = false;
            state.isResourceLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Folders reducers
            .addCase(fetchResourceFolders.pending, (state) => { state.isLoading = true; })
            .addCase(fetchResourceFolders.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.folders = action.payload;
            })
            .addCase(fetchResourceFolders.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Could not load resources.";
            })
            // Create Folder reducers
            .addCase(createResourceFolder.pending, (state) => { state.isLoading = true; })
            .addCase(createResourceFolder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.folders.unshift(action.payload);
            })
            .addCase(createResourceFolder.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to create folder.";
            })
            // Update Folder reducers
            .addCase(updateResourceFolder.pending, (state) => { state.isLoading = true; })
            .addCase(updateResourceFolder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.folders = state.folders.map(f => f.id === action.payload.id ? action.payload : f);
            })
            .addCase(updateResourceFolder.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Failed to update folder. Check your internet connection or try again later";
            })
            // Delete Folder reducers
            .addCase(deleteResourceFolder.pending, (state) => { state.isLoading = true; })
            .addCase(deleteResourceFolder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.folders = state.folders.filter(f => f.id !== action.payload);
            })
            .addCase(deleteResourceFolder.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Failed to delete folder.";
            })
            // Fetch Folder Resources
            .addCase(fetchFolderResources.pending, (state) => { state.isResourceLoading = true; })
            .addCase(fetchFolderResources.fulfilled, (state, action) => {
                state.isResourceLoading = false;
                const index = state.folders.findIndex(f => f.id === action.payload.id);
                if (index !== -1) {
                    state.folders[index] = action.payload;
                }
            })
            .addCase(fetchFolderResources.rejected, (state, action: any) => {
                state.isResourceLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to fetch resources.";
            })
            // Create Resource reducers
            .addCase(createResource.pending, (state) => { state.isResourceLoading = true; })
            .addCase(createResource.fulfilled, (state, action) => {
                state.isResourceLoading = false;
                state.isSuccess = true;
                const folder = state.folders.find(f => f.id === action.payload.folder);
                if (folder) {
                    folder.resources.push(action.payload);
                }
            })
            .addCase(createResource.rejected, (state, action: any) => {
                state.isResourceLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Failed to upload resource.";
            })
            // Delete Resource reducers
            .addCase(deleteResource.pending, (state) => { state.isResourceLoading = true; })
            .addCase(deleteResource.fulfilled, (state, action) => {
                state.isResourceLoading = false;
                state.isSuccess = true;
                state.folders.forEach(f => {
                    f.resources = f.resources.filter(r => r.id !== action.payload);
                });
            })
            .addCase(deleteResource.rejected, (state, action: any) => {
                state.isResourceLoading = false;
                state.isError = true;
                state.message = action.payload?.detail || "Failed to delete resource.";
            });
    }
});

export const { resetResourceState } = resourceSlice.actions;
export default resourceSlice.reducer;