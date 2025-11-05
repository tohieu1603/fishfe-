/**
 * Redux Provider wrapper component
 */
'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { useEffect } from 'react';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect to WebSocket when app loads
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/orders/';
    store.dispatch({ type: 'websocket/connect', payload: wsUrl });

    // Cleanup on unmount
    return () => {
      store.dispatch({ type: 'websocket/disconnect' });
    };
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
