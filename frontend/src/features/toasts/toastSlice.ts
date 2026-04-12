import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'failure' | 'info';
}

const initialState: ToastItem[] = [];

const toastSlice = createSlice({
  name: 'toasts',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<ToastItem, 'id'>>) => {
      const isDuplicate = state.some(t => t.message === action.payload.message);
      if (isDuplicate) return;

      if (state.length >= 5) {
        state.pop();
      }
      state.unshift({
        ...action.payload,
        id: Date.now() + Math.random(),
      });
    },

    removeToast: (state, action: PayloadAction<number>) => {
      return state.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;