import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

export interface Notification {
    id: number;
    user: number;
    title: string;
    message: string;
    notification_type: 'RESOURCE' | 'QUIZ' | 'FLASHCARD' | 'REMARK' | 'SYSTEM';
    action_url: string | null;
    is_read: boolean;
    created_at: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    isError: boolean;
    message: string;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isError: false,
    message: '',
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/notifications/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch notifications.');
        }
    }
);

export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/notifications/unread_count/');
            return response.data.unread_count;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch unread count.');
        }
    }
);

export const markNotificationRead = createAsyncThunk(
    'notifications/markRead',
    async (notificationId: number, { rejectWithValue }) => {
        try {
            await api.post(`/api/notifications/${notificationId}/mark_read/`);
            return notificationId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to mark as read.');
        }
    }
);

export const markAllRead = createAsyncThunk(
    'notifications/markAllRead',
    async (_, { rejectWithValue }) => {
        try {
            await api.post('/api/notifications/mark_all_read/');
            return true;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to mark all as read.');
        }
    }
);

export const clearAllNotifications = createAsyncThunk(
    'notifications/clearAll',
    async (_, { rejectWithValue }) => {
        try {
            await api.delete('/api/notifications/clear_all/');
            return true;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to clear notifications.');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        resetNotificationState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        },
        addNotification: (state, action: PayloadAction<Notification>) => {
            if (!state.notifications.find(n => n.id === action.payload.id)) {
                state.notifications.unshift(action.payload);
                if (!action.payload.is_read) {
                    state.unreadCount += 1;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // FETCH ALL
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
                state.isLoading = false;
                state.notifications = action.payload;
                state.unreadCount = action.payload.filter((n: Notification) => !n.is_read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Could not load notifications.';
            })

            // UNREAD COUNT
            .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
                state.unreadCount = action.payload;
            })

            // MARK ONE READ
            .addCase(markNotificationRead.fulfilled, (state, action: PayloadAction<number>) => {
                const notif = state.notifications.find(n => n.id === action.payload);
                if (notif && !notif.is_read) {
                    notif.is_read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })

            // MARK ALL READ
            .addCase(markAllRead.fulfilled, (state) => {
                state.notifications.forEach(n => { n.is_read = true; });
                state.unreadCount = 0;
            })

            // CLEAR ALL
            .addCase(clearAllNotifications.fulfilled, (state) => {
                state.notifications = [];
                state.unreadCount = 0;
            });
    },
});

export const { resetNotificationState, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
