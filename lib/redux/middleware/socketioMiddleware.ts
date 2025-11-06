/**
 * Socket.IO middleware for Redux
 * Replaces WebSocket middleware with Socket.IO client
 */
import { Middleware } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { setWebsocketConnected, setWebsocketError } from '../slices/uiSlice';
import {
  orderCreatedWS,
  orderUpdatedWS,
  orderDeletedWS,
  orderStatusChangedWS,
} from '../slices/ordersSlice';
import {
  commentCreatedWS,
  commentUpdatedWS,
  commentDeletedWS,
} from '../slices/commentsSlice';
import { toast } from 'sonner';

interface SocketIOAction {
  type: string;
  payload?: string;
}

let socket: Socket | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let hasConnectedBefore = false; // Track if this is the first connection
const HEARTBEAT_INTERVAL = 30000; // Send ping every 30 seconds

const socketioMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  const socketAction = action as SocketIOAction;

  // Socket.IO connection actions
  if (socketAction.type === 'websocket/connect') {
    const socketUrl = socketAction.payload || 'http://localhost:4000';

    if (socket && socket.connected) {
      console.log('⚠️ Socket.IO already connected');
      return next(action);
    }

    console.log('🔌 Connecting to Socket.IO:', socketUrl);

    // Create Socket.IO client
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    // Connection established
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket?.id);
      store.dispatch(setWebsocketConnected(true));

      // Only show toast on reconnect, not on first connection
      if (hasConnectedBefore) {
        toast.success('Đã kết nối lại realtime');
      }
      hasConnectedBefore = true;

      // Start heartbeat to keep connection alive
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      heartbeatInterval = setInterval(() => {
        if (socket && socket.connected) {
          socket.emit('ping', { timestamp: Date.now() });
          console.log('💓 Heartbeat sent');
        }
      }, HEARTBEAT_INTERVAL);
    });

    // Connection established message from server
    socket.on('connection_established', (data: any) => {
      console.log('✅ Connection established:', data.message);
    });

    // Heartbeat response
    socket.on('pong', (data: any) => {
      console.log('💓 Heartbeat received:', data.timestamp);
    });

    // Order created event
    socket.on('order_created', (data: any) => {
      console.log('🆕 Order created:', data.order);
      store.dispatch(orderCreatedWS(data.order));
      toast.success(`🆕 Đơn hàng mới: #${data.order.order_number}`, {
        description: `Khách hàng: ${data.order.customer_name}`,
        duration: 5000,
      });
    });

    // Order updated event
    socket.on('order_updated', (data: any) => {
      console.log('🔄 Order updated:', data.order);
      store.dispatch(orderUpdatedWS(data.order));
      toast.info(`✏️ Đơn #${data.order.order_number} đã được cập nhật`, {
        description: `Khách hàng: ${data.order.customer_name}`,
        duration: 4000,
      });
    });

    // Order deleted event
    socket.on('order_deleted', (data: any) => {
      console.log('🗑️ Order deleted:', data.order_id);
      store.dispatch(orderDeletedWS(parseInt(data.order_id)));
      toast.error(`🗑️ Đơn hàng đã bị xóa`, {
        duration: 4000,
      });
    });

    // Order status changed event
    socket.on('order_status_changed', (data: any) => {
      console.log('🔄 Order status changed:', data);
      store.dispatch(orderStatusChangedWS(data.order));
      toast.info(`🔄 Đơn #${data.order.order_number} → ${data.new_status}`, {
        description: `Khách hàng: ${data.order.customer_name}`,
        duration: 4000,
      });
    });

    // Order image uploaded event
    socket.on('order_image_uploaded', (data: any) => {
      console.log('🖼️ Order image uploaded:', data);
      store.dispatch(orderUpdatedWS(data.order));
      toast.success(`📸 Đơn #${data.order.order_number} - Đã thêm ảnh`, {
        description: `Khách hàng: ${data.order.customer_name}`,
        duration: 4000,
      });
    });

    // Order image deleted event
    socket.on('order_image_deleted', (data: any) => {
      console.log('🗑️ Order image deleted:', data);
      store.dispatch(orderUpdatedWS(data.order));
      toast.info(`🖼️ Đơn #${data.order.order_number} - Đã xóa ảnh`, {
        description: `Khách hàng: ${data.order.customer_name}`,
        duration: 4000,
      });
    });

    // Order assigned event
    socket.on('order_assigned', (data: any) => {
      console.log('👥 Order assigned:', data);
      store.dispatch(orderUpdatedWS(data.order));
      toast.info(`👥 Đơn #${data.order.order_number} - Đã phân công`, {
        description: `Khách hàng: ${data.order.customer_name}`,
        duration: 4000,
      });
    });

    // Connection error
    socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      store.dispatch(setWebsocketError('Connection error: ' + error.message));
    });

    // Disconnected
    socket.on('disconnect', (reason: string) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      store.dispatch(setWebsocketConnected(false));

      // Clear heartbeat interval
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        console.log('🔄 Server disconnected, attempting to reconnect...');
        socket?.connect();
      }
      // For other reasons, Socket.IO will auto-reconnect
    });

    // Reconnection attempt
    socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    // Reconnection failed
    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      store.dispatch(setWebsocketError('Failed to reconnect to server'));
      toast.error('Mất kết nối realtime. Vui lòng tải lại trang.');
    });

    // Successfully reconnected
    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      store.dispatch(setWebsocketConnected(true));
      // Toast is already shown in 'connect' event
    });

    // ==================== Comment/Chat Events ====================

    // Comment created event
    socket.on('comment_created', (data: any) => {
      console.log('💬 Comment created:', data);
      store.dispatch(commentCreatedWS({
        orderId: parseInt(data.order_id),
        comment: data.comment
      }));

      // Show toast notification (except for system messages)
      if (!data.comment.is_system_message) {
        toast.info(`💬 ${data.comment.user_name}: ${data.comment.message?.substring(0, 50) || '📷 Gửi ảnh'}`, {
          duration: 3000,
        });
      }
    });

    // Comment updated event
    socket.on('comment_updated', (data: any) => {
      console.log('✏️ Comment updated:', data);
      store.dispatch(commentUpdatedWS({
        orderId: parseInt(data.order_id),
        comment: data.comment
      }));
    });

    // Comment deleted event
    socket.on('comment_deleted', (data: any) => {
      console.log('🗑️ Comment deleted:', data);
      store.dispatch(commentDeletedWS({
        orderId: parseInt(data.order_id),
        commentId: parseInt(data.comment_id)
      }));
    });
  }

  // Socket.IO disconnect action
  if (socketAction.type === 'websocket/disconnect') {
    if (socket) {
      console.log('🔌 Disconnecting Socket.IO');
      socket.disconnect();
      socket = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    store.dispatch(setWebsocketConnected(false));
  }

  return next(action);
};

export default socketioMiddleware;
