import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

interface userDetails {
  id: BigInteger;
  username: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student';
  org_name: string;
  is_superuser?: boolean;
}
// Defining the shape and initial state of our login state
interface LoginState {
  user: userDetails | null;
  isAuthenticated: boolean;
  isVerifying: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const savedUser = localStorage.getItem('user');

// initializing the state with default values
const initialState: LoginState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isVerifying: true,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

export const verifyUserToken = createAsyncThunk(
  'login/verifyToken',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('api/verify/'); 
      return response.data as userDetails;
    } catch (error: any) {
      return thunkAPI.rejectWithValue("Session expired");
    }
  }
);

// Creating thunk for handling the login process asynchronously
export const loginUser = createAsyncThunk( 'login/loginuser',
  async (userData: any, thunkAPI) => {
    try {
      const response = await api.post('api/token/', userData);

      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || "Could not connect to server. Check your Internet connection or Try again later";
      return thunkAPI.rejectWithValue(message);
    }
  }
)

// Creating the slice for login with reducers and extra reducers to handle the async actions
export const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setVerifying: (state, action: PayloadAction<boolean>) => {
      state.isVerifying = action.payload;
    },
    logout: (state) => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user')
      
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isAuthenticated = true;
        state.user = action.payload.user || null;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.accessToken = null;
        state.refreshToken = null;
      })
      .addCase(verifyUserToken.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isVerifying = false;
        state.isAuthenticated = true;
      })
      .addCase(verifyUserToken.rejected, (state, action) => {
        state.isVerifying = false;
        if (action.payload === "Session expired") {
          state.user = null;
          state.isAuthenticated = false;
          state.accessToken = null;
          state.refreshToken = null;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      });
    }
});

export const { reset, logout, setVerifying } = auth.actions;
export default auth.reducer;