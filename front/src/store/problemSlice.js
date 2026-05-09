import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../utils/axiosClient';

// Async thunk to fetch all problems
export const fetchAllProblems = createAsyncThunk(
  'problems/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/problem/getAllProblem');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch problems');
    }
  }
);

// Async thunk to fetch solved problems
export const fetchSolvedProblems = createAsyncThunk(
  'problems/fetchSolved',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/problem/problemSolvedByUser');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch solved problems');
    }
  }
);

// Async thunk to delete a problem
export const deleteProblem = createAsyncThunk(
  'problems/delete',
  async (problemId, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/problem/delete/${problemId}`);
      return problemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete problem');
    }
  }
);

const problemSlice = createSlice({
  name: 'problems',
  initialState: {
    allProblems: [],
    solvedProblems: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    // Clear problems (useful for logout)
    clearProblems: (state) => {
      state.allProblems = [];
      state.solvedProblems = [];
      state.lastFetched = null;
    },
    // Add a new problem (after creation)
    addProblem: (state, action) => {
      state.allProblems.unshift(action.payload);
    },
    // Update a problem
    updateProblem: (state, action) => {
      const index = state.allProblems.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.allProblems[index] = action.payload;
      }
    },
    // Mark problem as solved
    markProblemSolved: (state, action) => {
      const problemId = action.payload;
      if (!state.solvedProblems.some(p => p._id === problemId || p === problemId)) {
        state.solvedProblems.push(problemId);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch all problems
    builder
      .addCase(fetchAllProblems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProblems.fulfilled, (state, action) => {
        state.loading = false;
        state.allProblems = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchAllProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch solved problems
    builder
      .addCase(fetchSolvedProblems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSolvedProblems.fulfilled, (state, action) => {
        state.loading = false;
        state.solvedProblems = action.payload;
      })
      .addCase(fetchSolvedProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete problem
    builder
      .addCase(deleteProblem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProblem.fulfilled, (state, action) => {
        state.loading = false;
        state.allProblems = state.allProblems.filter(p => p._id !== action.payload);
      })
      .addCase(deleteProblem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProblems, addProblem, updateProblem, markProblemSolved } = problemSlice.actions;

// Selectors
export const selectAllProblems = (state) => state.problems.allProblems;
export const selectSolvedProblems = (state) => state.problems.solvedProblems;
export const selectProblemsLoading = (state) => state.problems.loading;
export const selectProblemsError = (state) => state.problems.error;
export const selectLastFetched = (state) => state.problems.lastFetched;

// Selector to check if a problem is solved
export const selectIsProblemSolved = (problemId) => (state) => {
  return state.problems.solvedProblems.some(p => {
    if (typeof p === 'string') return p === problemId;
    if (p._id === problemId) return true;
    if (p.problemId === problemId) return true;
    if (p.problemId?._id === problemId) return true;
    return false;
  });
};

// Selector to get problems by difficulty
export const selectProblemsByDifficulty = (difficulty) => (state) => {
  return state.problems.allProblems.filter(
    p => p.difficulty?.toLowerCase() === difficulty.toLowerCase()
  );
};

export default problemSlice.reducer;
