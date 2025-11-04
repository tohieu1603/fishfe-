"use client";

import { useEffect, useState, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, Search, ChevronDown, User, Filter, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProcessColumn } from "@/components/ProcessColumn";
import { CreateOrderDialog } from "@/components/CreateOrderDialog";
import { OrderDetailPage } from "@/components/OrderDetailPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { OverdueOrdersAlert } from "@/components/OverdueOrdersAlert";
import { Order, OrderStatus } from "@/types";
import { PROCESS_STAGES } from "@/lib/constants";
import { orderApi } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

function HomePage() {
  const {
    orders,
    setOrders,
    updateOrder,
    filters,
    setFilters,
    isCreateDialogOpen,
    setCreateDialogOpen,
    selectedOrderId,
    setSelectedOrderId,
    isLoading,
    setLoading,
  } = useStore();

  const [localSearch, setLocalSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching orders with filters:", filters);
      const response = await orderApi.getOrders(filters);
      console.log("Fetched orders:", response.items.length, "orders");
      setOrders(response.items);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters, setLoading, setOrders]);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderDrop = async (order: Order, newStatus: OrderStatus) => {
    try {
      updateOrder(order.id, { status: newStatus });
      await orderApi.updateOrderStatus(order.id, { new_status: newStatus });
      fetchOrders();
      toast.success("Chuyển trạng thái thành công!");
    } catch (error) {
      console.error("Failed to update order status:", error);
      updateOrder(order.id, { status: order.status });
      toast.error("Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại!");
    }
  };

  const handleOrderTransition = async (order: Order, newStatus: OrderStatus, data?: any) => {
    try {
      // Upload images if provided
      if (data?.images && data.images.length > 0) {
        for (const image of data.images) {
          await orderApi.uploadOrderImage(order.id, image, data.imageType || "other");
        }
      }

      // Prepare payload - only include fields that backend accepts
      const payload: any = {
        new_status: String(newStatus), // Ensure it's a string
      };

      // Only add failure_reason if provided
      if (data?.failure_reason) {
        payload.failure_reason = data.failure_reason;
      }

      // Update order status
      await orderApi.updateOrderStatus(order.id, payload);

      // Refresh orders
      fetchOrders();
      toast.success("Chuyển trạng thái thành công!");
    } catch (error: any) {
      console.error("Failed to transition order:", error);
      toast.error(`Không thể chuyển trạng thái. ${error?.response?.data?.detail || "Vui lòng thử lại!"}`);
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrderId(order.id);
  };

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    const timer = setTimeout(() => {
      setFilters({ search: value });
    }, 500);
    return () => clearTimeout(timer);
  };

  // Group orders by status
  const ordersByStatus = PROCESS_STAGES.reduce(
    (acc, stage) => {
      acc[stage.status] = orders.filter((order) => order.status === stage.status);
      return acc;
    },
    {} as Record<OrderStatus, Order[]>
  );

  // Calculate statistics
  const totalOrders = orders.length;
  const completedOrders = ordersByStatus[OrderStatus.COMPLETED]?.length || 0;
  const failedOrders = ordersByStatus[OrderStatus.FAILED]?.length || 0;
  const activeOrders = totalOrders - completedOrders - failedOrders;

  // Show order detail page if order is selected
  if (selectedOrderId) {
    return (
      <OrderDetailPage orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        {/* Page Header */}
        <div className="mb-3 md:mb-6">
          <div className="flex items-center justify-between gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">Đơn hàng</h1>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">
                Hiển thị: {activeOrders}/{totalOrders} đơn | Hoàn thành: {completedOrders} | Thất bại: {failedOrders}
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-black hover:bg-gray-800 text-white flex items-center gap-1.5 md:gap-2 shrink-0"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo đơn mới</span>
              <span className="sm:hidden">Tạo</span>
            </Button>
          </div>

          {/* Overdue Orders Alert */}
          <OverdueOrdersAlert orders={orders} />

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
              <Input
                placeholder="Tìm đơn hàng..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 md:pl-9 h-9 md:h-10 text-sm"
              />
            </div>

            {/* Hide extra filters on mobile */}
            <Button variant="outline" className="min-w-[140px] justify-between hidden md:flex">
              Tất cả trạng thái
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>

            <Button
              variant={filters.myOrders ? "default" : "outline"}
              onClick={() => setFilters({ myOrders: !filters.myOrders })}
              size="sm"
              className="hidden sm:flex"
            >
              <User className="h-4 w-4 mr-2" />
              Đơn của tôi
            </Button>

            {/* Mobile: Show only filter icon */}
            <Button variant="outline" size="sm" className="md:hidden shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kanban Board - Desktop only, hidden on mobile */}
        <div className="flex-1 overflow-hidden hidden md:block">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 h-full">
              {PROCESS_STAGES.map((stage) => (
                <ProcessColumn
                  key={stage.status}
                  stage={stage}
                  orders={ordersByStatus[stage.status] || []}
                  onOrderClick={handleOrderClick}
                  onOrderDrop={handleOrderDrop}
                  onOrderTransition={handleOrderTransition}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile List View - Mobile only */}
        <div className="flex-1 overflow-hidden md:hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-base text-gray-600">Đang tải...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Status Tabs - Compact */}
              <div className="flex overflow-x-auto gap-1.5 px-3 py-2 border-b bg-white">
                {PROCESS_STAGES.map((stage) => {
                  const count = ordersByStatus[stage.status]?.length || 0;
                  const isActive = filters.status === stage.status;
                  return (
                    <button
                      key={stage.status}
                      onClick={() => setFilters({ status: isActive ? undefined : stage.status })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{stage.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive ? 'bg-white text-black' : 'bg-white text-gray-900'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Orders List - Compact */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50">
                {(() => {
                  const displayOrders = filters.status
                    ? ordersByStatus[filters.status] || []
                    : orders;

                  if (displayOrders.length === 0) {
                    return (
                      <div className="text-center py-8 text-sm text-gray-400">
                        Không có đơn hàng
                      </div>
                    );
                  }

                  return displayOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 active:bg-gray-50 transition-colors"
                    >
                      {/* Header - Compact */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900">#{order.order_number}</h3>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">{order.customer_name}</p>
                        </div>
                        {order.is_overdue && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold ml-2 shrink-0">
                            Quá hạn
                          </span>
                        )}
                      </div>

                      {/* Info Grid - Compact */}
                      <div className="space-y-1.5 mb-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{order.items_count} SP</span>
                          <span className="text-sm font-bold text-gray-900">
                            {Number(order.total || 0).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">SĐT</span>
                          <span className="font-medium text-blue-600">{order.customer_phone}</span>
                        </div>
                      </div>

                      {/* Footer - Compact */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {PROCESS_STAGES.find(s => s.status === order.status)?.label}
                        </span>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <CreateOrderDialog
          open={isCreateDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchOrders}
        />
      </div>
    </DndProvider>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <HomePage />
      </AppLayout>
    </ProtectedRoute>
  );
}
