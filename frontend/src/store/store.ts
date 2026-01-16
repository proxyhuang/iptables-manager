import { configureStore } from '@reduxjs/toolkit';
import rulesReducer from './slices/rulesSlice';
import statsReducer from './slices/statsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    rules: rulesReducer,
    stats: statsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
