/**
 * Redux Provider wrapper component
 */
'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { useEffect } from 'react';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect to Socket.IO server when app loads
    const socketUrl = process.env.NEXT_PUBLIC_SOCKETIO_URL || 'http://localhost:4000';
    store.dispatch({ type: 'websocket/connect', payload: socketUrl });

    // Cleanup on unmount
    return () => {
      store.dispatch({ type: 'websocket/disconnect' });
    };
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
