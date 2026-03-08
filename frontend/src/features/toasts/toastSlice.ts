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
      if (state.length >= 1) {
        state.shift();
      }
      state.push({
        ...action.payload,
        id: Date.now(),
      });
    },

    removeToast: (state, action: PayloadAction<number>) => {
      return state.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;