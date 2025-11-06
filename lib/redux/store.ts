/**
 * Redux store configuration with Socket.IO middleware
 */
import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './slices/ordersSlice';
import uiReducer from './slices/uiSlice';
import commentsReducer from './slices/commentsSlice';
import socketioMiddleware from './middleware/socketioMiddleware';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    ui: uiReducer,
    comments: commentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for websocket connection
        ignoredActions: ['websocket/connect', 'websocket/disconnect'],
      },
    }).concat(socketioMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
