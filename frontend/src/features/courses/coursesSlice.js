import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAllCourses, fetchCourseById, fetchAllUserProgress } from './coursesAPI';
import { getCurrentUserId } from '@/lib/auth';

const isPastDeadline = (deadline) => {
  if (!deadline) return false;
  const dueEndOfDay = new Date(`${deadline}T23:59:59`);
  return Number.isFinite(dueEndOfDay.getTime()) && Date.now() > dueEndOfDay.getTime();
};

const withDeadlineLock = (course) => {
  const status = String(course?.progressStatus || '').trim().toLowerCase();
  const isCompleted = course?.completed === true || status === 'completed';
  return {
    ...course,
    isDeadlineLocked: !isCompleted && isPastDeadline(course?.deadline),
  };
};

export const loadAllCourses = createAsyncThunk(
  'courses/loadAllCourses',
  async ({ page = 1, pageSize = 9 } = {}, { rejectWithValue }) => {
    try {
      const result = await fetchAllCourses({ page, pageSize });
      const courses = result.items || [];
      const userId = getCurrentUserId();
      let enrichedCourses = courses;
      if (userId) {
        const progressByCourse = await fetchAllUserProgress(userId);
        enrichedCourses = courses
          .map((c) => ({
            ...c,
            completed: progressByCourse[c.id]?.completed ?? c.completed,
            certificationGenerated: progressByCourse[c.id]?.certificate_issued ?? c.certificationGenerated,
            progressStatus: progressByCourse[c.id]?.progress_status ?? null,
            feedbackSubmitted: progressByCourse[c.id]?.feedback_submitted ?? false,
          }))
          .map(withDeadlineLock);
      } else {
        enrichedCourses = courses.map(withDeadlineLock);
      }
      return {
        items: enrichedCourses,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Load a single course by documentId. Optionally pass language so backend returns only that language's modules/quiz/feedback.
 * @param {string | { documentId: string, language?: string }} arg - documentId string or { documentId, language }.
 */
export const loadCourseById = createAsyncThunk(
  'courses/loadCourseById',
  async (arg, { rejectWithValue }) => {
    try {
      const documentId = typeof arg === 'string' ? arg : arg?.documentId;
      const language = typeof arg === 'object' && arg != null ? arg.language : undefined;
      return await fetchCourseById(documentId, language ? { language } : {});
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Alias for backwards compatibility
export const loadCourseCategories = loadAllCourses;

const initialState = {
  coursesList: [],
  totalPages: 1,
  totalCount: 0,
  currentPage: 1,
  loading: false,
  error: null,
  currentCourse: null,
  courseDetailLoading: false,
  courseDetailError: null,
};

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    resetCoursesState: () => initialState,
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
      state.courseDetailError = null;
    },
    markModuleAsRead: (state, action) => {
      const { moduleId } = action.payload;
      if (state.currentCourse?.modulesList) {
        const mod = state.currentCourse.modulesList.find(
          m => String(m.moduleId || m.id) === String(moduleId)
        );
        if (mod) mod.mark_as_read = true;
      }
    },
    initializeModuleReadState: (state, action) => {
      const completedIds = action.payload;
      if (state.currentCourse?.modulesList) {
        state.currentCourse.modulesList.forEach(mod => {
          const byModuleId = mod.moduleId && completedIds.includes(String(mod.moduleId));
          const byId = mod.id != null && completedIds.includes(String(mod.id));
          mod.mark_as_read = byModuleId || byId;
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAllCourses.fulfilled, (state, action) => {
        state.loading = false;
        const incomingItems = action.payload.items || [];
        const currentPage = action.payload.currentPage || 1;
        
        // If page 1, replace; otherwise append
        if (currentPage === 1) {
          state.coursesList = incomingItems;
        } else {
          const seen = new Set(state.coursesList.map((c) => String(c.id || c.documentId)));
          for (const course of incomingItems) {
            const idKey = String(course?.id || course?.documentId);
            if (seen.has(idKey)) continue;
            seen.add(idKey);
            state.coursesList.push(course);
          }
        }
        
        state.totalPages = action.payload.totalPages || 1;
        state.totalCount = action.payload.totalCount || 0;
        state.currentPage = currentPage;
      })
      .addCase(loadAllCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loadCourseById.pending, (state) => {
        state.courseDetailLoading = true;
        state.courseDetailError = null;
      })
      .addCase(loadCourseById.fulfilled, (state, action) => {
        state.courseDetailLoading = false;
        state.currentCourse = action.payload;
      })
      .addCase(loadCourseById.rejected, (state, action) => {
        state.courseDetailLoading = false;
        state.courseDetailError = action.payload;
      });
  },
});

export const { clearError, setPage, resetCoursesState, clearCurrentCourse, markModuleAsRead, initializeModuleReadState } = coursesSlice.actions;
export default coursesSlice.reducer;
