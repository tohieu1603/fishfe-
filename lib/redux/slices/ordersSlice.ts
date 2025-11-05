/**
 * Redux slice for orders state management
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { orderApi } from '@/lib/api';
import type { Order, OrderFilterParams } from '@/types';

interface OrdersState {
  items: Order[];
  loading: boolean;
  error: string | null;
  total: number;
  filters: OrderFilterParams;
}

const initialState: OrdersState = {
  items: [],
  loading: false,
  error: null,
  total: 0,
  filters: {
    page: 1,
    page_size: 100,
    search: '',
    status: undefined,
    assigned_to_me: false,
  },
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (filters: OrderFilterParams) => {
    const response = await orderApi.getOrders(filters);
    return response;
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: any) => {
    const response = await orderApi.createOrder(orderData);
    return response;
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, data }: { orderId: number; data: any }) => {
    const response = await orderApi.updateOrderStatus(orderId, data);
    return response;
  }
);

export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async (orderId: number) => {
    await orderApi.deleteOrder(orderId);
    return orderId;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<OrderFilterParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    // WebSocket event handlers
    orderCreatedWS: (state, action: PayloadAction<Order>) => {
      console.log('🔄 orderCreatedWS reducer called with:', action.payload);
      console.log('📊 Current items count:', state.items.length);

      // Check if order already exists (prevent duplicates)
      const exists = state.items.some(order => order.id === action.payload.id);
      console.log('❓ Order exists?', exists);

      if (!exists) {
        state.items.unshift(action.payload);
        state.total += 1;
        console.log('✅ Added order to state. New count:', state.items.length);
      } else {
        console.log('⚠️ Order already exists, skipping');
      }
    },
    orderUpdatedWS: (state, action: PayloadAction<Order>) => {
      const index = state.items.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    orderDeletedWS: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(order => order.id !== action.payload);
      state.total -= 1;
    },
    orderStatusChangedWS: (state, action: PayloadAction<Order>) => {
      const index = state.items.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        // DO NOT add order here - WebSocket will handle it
        // This prevents race condition where order gets added twice
        console.log('✅ Order created via API, waiting for WebSocket update...');
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create order';
      })
      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state) => {
        // DO NOT update order here - WebSocket will handle it
        console.log('✅ Order status updated via API, waiting for WebSocket update...');
      })
      // Delete order
      .addCase(deleteOrder.fulfilled, (state) => {
        // DO NOT delete order here - WebSocket will handle it
        console.log('✅ Order deleted via API, waiting for WebSocket update...');
      });
  },
});

export const {
  setFilters,
  clearFilters,
  orderCreatedWS,
  orderUpdatedWS,
  orderDeletedWS,
  orderStatusChangedWS,
} = ordersSlice.actions;

export default ordersSlice.reducer;
