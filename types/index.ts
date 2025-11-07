// Order Status Enum - matches backend
export enum OrderStatus {
  CREATED = "created",
  WEIGHING = "weighing",
  CREATE_INVOICE = "create_invoice",
  SEND_PHOTO = "send_photo",
  PAYMENT = "payment",
  IN_KITCHEN = "in_kitchen",
  PROCESSING = "processing",
  DELIVERY = "delivery",
  COMPLETED = "completed",
  FAILED = "failed",
}

// User Role Enum
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  SALE = "sale",
  KITCHEN = "kitchen",
}

// Image Type Enum
export enum ImageType {
  WEIGHING = "weighing",
  INVOICE = "invoice",
  ATTACHMENT = "attachment",
}

// User Interface
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  avatar?: string | null;
}

// Product Interface
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Order Item Interface
export interface OrderItem {
  id?: number;
  product?: Product;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  price: number; // Alias for unit_price
  total_price: number;
  note?: string;
}

// Order Image Interface
export interface OrderImage {
  id: number;
  image: string;
  image_type: ImageType;
  description?: string;
  uploaded_by?: User;
  uploaded_at: string;
}

// Order Status History Interface
export interface OrderStatusHistory {
  id: number;
  status: OrderStatus;
  changed_at: string;
  changed_by?: User;
  note?: string;
}

// Order Interface
export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  loyalty_phone?: string;
  assigned_to?: User[];
  created_by?: User;
  items: OrderItem[];
  images: OrderImage[];
  status_history: OrderStatusHistory[];
  subtotal?: string | number;
  shipping_fee: number | string;
  chip_fee: number | string;
  total: string | number; // Backend returns as string
  total_amount?: number; // Deprecated, use 'total' instead
  preparation_time?: string;
  delivery_time?: string;
  deadline?: string;
  notes?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;

  // Calculated fields from backend
  items_count?: number;
  images_count?: number;
  is_overdue?: boolean;
  remaining_minutes?: number;
}

// Process Stage Interface
export interface ProcessStage {
  status: OrderStatus;
  label: string;
  color: string;
  duration: number; // in minutes
  warningThreshold: number; // in minutes
  requiresImages?: ImageType[];
}

// Filter State Interface
export interface FilterState {
  search: string;
  status?: OrderStatus;
  myOrders: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Order Filter Params (for API calls)
export interface OrderFilterParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: OrderStatus | string;
  assigned_to_me?: boolean;
  date_from?: string;
  date_to?: string;
}

// Create Order Input
export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  assigned_to_ids?: number[];
  items: {
    product_id?: number;
    product_name: string;
    quantity: number;
    unit: string;
    price: number;
  }[];
  shipping_fee: number;
  chip_fee: number;
  preparation_time?: string;
  delivery_time?: string;
  notes?: string;
}

// Update Order Status Input
export interface UpdateOrderStatusInput {
  new_status: OrderStatus;
  note?: string;
  failure_reason?: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Order Statistics
export interface OrderStatistics {
  total_orders: number;
  by_status: Record<OrderStatus, number>;
  total_revenue: number;
  average_order_value: number;
}

// Order Activity
export interface OrderActivity {
  id: number;
  activity_type: 'status_change' | 'created' | 'updated' | 'image_uploaded' | 'image_deleted' | 'comment';
  description: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, any>;
  user?: {
    id: number;
    username: string;
    full_name: string;
    email?: string;
  };
  created_at: string;
}
