import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

// ── Helper ────────────────────────────────────────────────────────────

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

// ── Thunks ────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register', userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, 'Registration failed'),
        status: error.response?.status || 500,
      });
    }
  }
);

export const sendVerifyOTP = createAsyncThunk(
  'auth/sendVerificationOTP',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/send-verify-otp');
      return response.data.message;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, 'Failed to send verification OTP'),
        status: error.response?.status || 500,
      });
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyEmail',
  async (otp, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/verify-account', { otp });
      return response.data.message;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, 'Failed to verify email'),
        status: error.response?.status || 500,
      });
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/login', credentials);
      return response.data.user;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, 'Login failed'),
        status: error.response?.status || 500,
      });
    }
  }
);

export const sendResetOTP = createAsyncThunk(
  'auth/sendResetOTP',
  async (emailId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/send-reset-otp', { emailId });
      return response.data.message;
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err, 'Failed to send OTP'),
        status: err.response?.status || 500,
      });
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ emailId, otp, password }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/reset-password', { emailId, otp, password });
      return response.data.message;
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err, 'Failed to reset password'),
        status: err.response?.status || 500,
      });
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/user/check');
      return data.user;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 404) {
        return rejectWithValue({ message: 'Not authenticated', status: 401 });
      }
      return rejectWithValue({
        message: getErrorMessage(error, 'Auth check failed'),
        status: error.response?.status || 500,
      });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/user/logout');
      return null;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, 'Logout failed'),
        status: error.response?.status || 500,
      });
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isVerified: false,      
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // User exists but is NOT authenticated until email is verified
        state.user = action.payload;
        state.isAuthenticated = false;
        state.isVerified = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Something went wrong';
        state.user = null;
        state.isAuthenticated = false;
      })

      // ── Send Verification OTP ─────────────────────────────────────
      .addCase(sendVerifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendVerifyOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendVerifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Something went wrong';
      })

      // ── Verify OTP ──────────────────────────────────────────────
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state) => {
        state.loading = false;
        state.isVerified = true;
        state.isAuthenticated = true;   // ← only authenticated after verification
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Something went wrong';
      })

      // ── Login ─────────────────────────────────────────────────────
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isVerified = true;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      })

      // ── Send Reset OTP ────────────────────────────────────────────
      .addCase(sendResetOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendResetOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendResetOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Something went wrong';
      })

      // ── Reset Password ────────────────────────────────────────────
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Something went wrong';
      })

      // ── Check Auth ────────────────────────────────────────────────
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.isVerified = !!action.payload;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = null;
        state.isAuthenticated = false;
        state.isVerified = false;
        state.user = null;
      })

      // ── Logout ────────────────────────────────────────────────────
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isVerified = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        // Force logout on client even if API call failed
        state.user = null;
        state.isAuthenticated = false;
        state.isVerified = false;
        state.error = action.payload?.message || action.error?.message || 'Something went wrong';
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
