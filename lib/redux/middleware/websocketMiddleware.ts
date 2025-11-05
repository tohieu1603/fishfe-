/**
 * WebSocket middleware for Redux
 * Handles real-time order updates via WebSocket connection
 */
import { Middleware } from '@reduxjs/toolkit';
import { setWebsocketConnected, setWebsocketError } from '../slices/uiSlice';
import {
  orderCreatedWS,
  orderUpdatedWS,
  orderDeletedWS,
  orderStatusChangedWS,
} from '../slices/ordersSlice';
import { toast } from 'sonner';

let socket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

const websocketMiddleware: Middleware = (store) => (next) => (action) => {
  // WebSocket connection actions
  if (action.type === 'websocket/connect') {
    const wsUrl = action.payload || 'ws://localhost:8000/ws/orders/';

    if (socket !== null && socket.readyState !== WebSocket.CLOSED) {
      return next(action);
    }

    console.log('🔌 Connecting to WebSocket:', wsUrl);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      reconnectAttempts = 0;
      store.dispatch(setWebsocketConnected(true));
      toast.success('Realtime updates connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message:', data);

        switch (data.type) {
          case 'connection_established':
            console.log('✅ Connection established:', data.message);
            break;

          case 'order_created':
            console.log('🆕 Order created:', data.order);
            store.dispatch(orderCreatedWS(data.order));
            toast.success(`Đơn hàng mới: #${data.order.order_number}`);
            break;

          case 'order_updated':
            console.log('🔄 Order updated:', data.order);
            store.dispatch(orderUpdatedWS(data.order));
            break;

          case 'order_deleted':
            console.log('🗑️ Order deleted:', data.order_id);
            store.dispatch(orderDeletedWS(parseInt(data.order_id)));
            toast.info('Đơn hàng đã bị xóa');
            break;

          case 'order_status_changed':
            console.log('🔄 Order status changed:', data);
            store.dispatch(orderStatusChangedWS(data.order));
            toast.info(`Đơn #${data.order.order_number} đã chuyển trạng thái`);
            break;

          case 'order_image_uploaded':
            console.log('🖼️ Order image uploaded:', data);
            // Dispatch action to update order in Redux
            store.dispatch(orderUpdatedWS(data.order));
            toast.info('Ảnh đã được tải lên');
            break;

          case 'order_image_deleted':
            console.log('🗑️ Order image deleted:', data);
            // Dispatch action to update order in Redux
            store.dispatch(orderUpdatedWS(data.order));
            toast.info('Ảnh đã được xóa');
            break;

          case 'order_assigned':
            console.log('👥 Order assigned:', data);
            // Dispatch action to update order in Redux
            store.dispatch(orderUpdatedWS(data.order));
            toast.info('Đã cập nhật phân công nhân viên');
            break;

          default:
            console.warn('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      store.dispatch(setWebsocketError('WebSocket connection error'));
    };

    socket.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      store.dispatch(setWebsocketConnected(false));

      // Auto-reconnect logic
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

        reconnectTimeout = setTimeout(() => {
          store.dispatch({ type: 'websocket/connect', payload: wsUrl });
        }, RECONNECT_DELAY);
      } else {
        console.error('❌ Max reconnect attempts reached');
        store.dispatch(setWebsocketError('Failed to reconnect to server'));
        toast.error('Mất kết nối realtime. Vui lòng tải lại trang.');
      }
    };
  }

  // WebSocket disconnect action
  if (action.type === 'websocket/disconnect') {
    if (socket !== null) {
      console.log('🔌 Disconnecting WebSocket');
      socket.close();
      socket = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    store.dispatch(setWebsocketConnected(false));
  }

  return next(action);
};

export default websocketMiddleware;
