import { create } from "zustand";
import type { Order, FilterState, User } from "@/types";

interface AppState {
  // Orders
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: number, updates: Partial<Order>) => void;
  removeOrder: (id: number) => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Current User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // UI State
  isCreateDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;

  selectedOrderId: number | null;
  setSelectedOrderId: (id: number | null) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const initialFilters: FilterState = {
  search: "",
  myOrders: false,
};

export const useStore = create<AppState>((set) => ({
  // Orders
  orders: [],
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === id ? { ...order, ...updates } : order)),
    })),
  removeOrder: (id) => set((state) => ({ orders: state.orders.filter((order) => order.id !== id) })),

  // Filters
  filters: initialFilters,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: initialFilters }),

  // Current User
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // UI State
  isCreateDialogOpen: false,
  setCreateDialogOpen: (open) => set({ isCreateDialogOpen: open }),

  selectedOrderId: null,
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
