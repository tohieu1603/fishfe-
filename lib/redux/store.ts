/**
 * Redux store configuration with WebSocket middleware
 */
import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './slices/ordersSlice';
import uiReducer from './slices/uiSlice';
import websocketMiddleware from './middleware/websocketMiddleware';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for websocket connection
        ignoredActions: ['websocket/connect', 'websocket/disconnect'],
      },
    }).concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
