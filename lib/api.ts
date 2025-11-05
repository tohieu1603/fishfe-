import axios, { AxiosError, AxiosInstance } from "axios";
import type {
  Order,
  CreateOrderInput,
  UpdateOrderStatusInput,
  PaginatedResponse,
  OrderStatistics,
  OrderActivity,
  User,
  Product,
  FilterState,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token if exists
apiClient.interceptors.request.use(
  (config) => {
    // Only access localStorage on client-side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Order API
export const orderApi = {
  // Get all orders with filters
  getOrders: async (filters?: FilterState, page = 1, pageSize = 100) => {
    const params: any = { page, page_size: pageSize };

    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.myOrders) params.assigned_to_me = true;
    if (filters?.dateFrom) params.date_from = filters.dateFrom;
    if (filters?.dateTo) params.date_to = filters.dateTo;

    const response = await apiClient.get<PaginatedResponse<Order>>("/orders/", { params });
    return response.data;
  },

  // Get single order by ID
  getOrder: async (id: number) => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Alias for getOrder
  getOrderById: async (id: number) => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Create new order
  createOrder: async (input: CreateOrderInput) => {
    const response = await apiClient.post<Order>("/orders/", input);
    return response.data;
  },

  // Update order (full update - items, customer info, fees, etc.)
  updateOrder: async (id: number, input: Partial<CreateOrderInput>) => {
    const response = await apiClient.patch<Order>(`/orders/${id}`, input);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id: number, input: UpdateOrderStatusInput) => {
    const response = await apiClient.patch<Order>(`/orders/${id}/status`, input);
    return response.data;
  },

  // Update assigned users
  updateAssignedUsers: async (id: number, userIds: number[]) => {
    const response = await apiClient.patch<Order>(`/orders/${id}/assigned-users`, {
      assigned_to_ids: userIds,
    });
    return response.data;
  },

  // Upload order images
  uploadOrderImage: async (id: number, file: File, imageType: string, description?: string) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("image_type", imageType);
    if (description) formData.append("description", description);

    const response = await apiClient.post(`/orders/${id}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete order image
  deleteOrderImage: async (orderId: number, imageId: number) => {
    await apiClient.delete(`/orders/${orderId}/images/${imageId}`);
  },

  // Delete order
  deleteOrder: async (id: number) => {
    await apiClient.delete(`/orders/${id}`);
  },

  // Get order statistics
  getStatistics: async () => {
    const response = await apiClient.get<OrderStatistics>("/orders/statistics/summary");
    return response.data;
  },

  // Get order activities
  getOrderActivities: async (orderId: number) => {
    const response = await apiClient.get(`/orders/${orderId}/activities`);
    return response.data;
  },
};

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    console.log("Attempting login with:", { username, passwordLength: password.length });

    const response = await apiClient.post<{
      access_token: string;
      token_type: string;
      user: User
    }>("/auth/login", {
      username,
      password,
    });

    console.log("Login response:", response.data);

    // Store token in localStorage
    if (response.data.access_token) {
      localStorage.setItem("auth_token", response.data.access_token);
    }

    return response.data;
  },

  register: async (data: {
    username: string;
    password: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: string;
  }) => {
    const response = await apiClient.post<{
      access_token: string;
      token_type: string;
      user: User
    }>("/auth/register", data);

    // Store token in localStorage
    if (response.data.access_token) {
      localStorage.setItem("auth_token", response.data.access_token);
    }

    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");
    }
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get<User[]>("/auth/users");
    return response.data;
  },
};

// Product API
export const productApi = {
  getProducts: async () => {
    const response = await apiClient.get<Product[]>("/products/");
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  const response = await apiClient.get("/health");
  return response.data;
};

export default apiClient;
