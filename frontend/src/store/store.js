import { configureStore } from '@reduxjs/toolkit';
import homeReducer from '@/features/home/homeSlice';
import newsReducer from '@/features/news/newsSlice';
import peopleReducer from '@/features/people/peopleSlice';
import resourcesReducer from '@/features/resources/resourcesSlice';
import policiesReducer from '@/features/resources/policiesSlice';
import formTemplatesReducer from '@/features/resources/formTemplatesSlice';
import galleryReducer from '@/features/gallery/gallerySlice';
import coursesReducer from '@/features/courses/coursesSlice';
import locationsReducer from '@/features/location/locationSlice';

// Import your feature slices here as you create them
// import authReducer from '@/features/auth/authSlice';

export const store = configureStore({
  reducer: {
    home: homeReducer, 
    news: newsReducer, // ← ADD THIS
    people: peopleReducer,
    resources: resourcesReducer,
    policies: policiesReducer,
    formTemplates: formTemplatesReducer,
    gallery: galleryReducer,
    courses: coursesReducer,
    locations: locationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;