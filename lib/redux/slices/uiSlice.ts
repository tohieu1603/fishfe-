/**
 * Redux slice for UI state management
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  websocketConnected: boolean;
  websocketError: string | null;
  sidebarOpen: boolean;
}

const initialState: UIState = {
  websocketConnected: false,
  websocketError: null,
  sidebarOpen: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setWebsocketConnected: (state, action: PayloadAction<boolean>) => {
      state.websocketConnected = action.payload;
      if (action.payload) {
        state.websocketError = null;
      }
    },
    setWebsocketError: (state, action: PayloadAction<string | null>) => {
      state.websocketError = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const {
  setWebsocketConnected,
  setWebsocketError,
  toggleSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
