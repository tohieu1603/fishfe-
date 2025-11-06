"use client";

import { useEffect, useState, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, Search, ChevronDown, User, ChevronRight, Check, Calendar, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProcessColumn } from "@/components/ProcessColumn";
import { CreateOrderDialog } from "@/components/CreateOrderDialog";
import { OrderDetailPage } from "@/components/OrderDetailPage";
import { ConfirmTransitionDialog } from "@/components/ConfirmTransitionDialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { OverdueOrdersAlert } from "@/components/OverdueOrdersAlert";
import { Order, OrderStatus } from "@/types";
import { PROCESS_STAGES } from "@/lib/constants";
import { orderApi } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchOrders, setFilters, updateOrderStatus } from "@/lib/redux/slices/ordersSlice";
import { toast } from "sonner";

function HomePage() {
  const dispatch = useAppDispatch();
  const { items: orders, loading: isLoading, filters } = useAppSelector((state) => state.orders);

  // Local UI state
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [localSearch, setLocalSearch] = useState("");
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{
    order: Order;
    newStatus: OrderStatus;
  } | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const kanbanScrollRef = useRef<HTMLDivElement>(null);

  // Fetch orders on mount and when filters change
  useEffect(() => {
    dispatch(fetchOrders(filters));
  }, [dispatch, filters]);

  const handleOrderDrop = async (order: Order, newStatus: OrderStatus) => {
    // Open confirmation dialog instead of directly updating
    setPendingTransition({ order, newStatus });
    setShowTransitionDialog(true);
  };

  const handleConfirmTransition = async (data?: any) => {
    if (!pendingTransition) return;

    const { order, newStatus } = pendingTransition;

    try {
      // Upload images if provided
      if (data?.images && data.images.length > 0) {
        for (const image of data.images) {
          await orderApi.uploadOrderImage(order.id, image, data.imageType || "other");
        }
      }

      // Prepare payload
      const payload: any = {
        new_status: String(newStatus),
      };

      // Add optional fields if provided
      if (data?.failure_reason) {
        payload.failure_reason = data.failure_reason;
      }

      // Update order status
      await orderApi.updateOrderStatus(order.id, payload);

      // No need to refresh - WebSocket will handle realtime updates
      toast.success("Chuyển trạng thái thành công!");
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      toast.error(`Không thể cập nhật trạng thái. ${error?.response?.data?.detail || "Vui lòng thử lại!"}`);
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

      // No need to refresh - WebSocket will handle realtime updates
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
      setFilters({ ...filters, search: value });
    }, 500);
    return () => clearTimeout(timer);
  };

  const checkScrollButtons = () => {
    if (kanbanScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = kanbanScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanScrollRef.current) {
      const scrollAmount = 400;
      kanbanScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max pb-2">
                <div className="w-[250px] md:w-[300px] relative shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm đơn hàng..."
                    value={localSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 md:pl-9 h-9 md:h-10 text-sm"
                  />
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="h-9 md:h-10 w-[140px] text-sm"
                    placeholder="Từ ngày"
                  />
                  <span className="text-gray-500 text-sm">-</span>
                  <Input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="h-9 md:h-10 w-[140px] text-sm"
                    placeholder="Đến ngày"
                  />
                </div>

                {/* Quick Date Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Calendar className="h-4 w-4 mr-2" />
                      {filters.dateFrom || filters.dateTo ? "Đã lọc" : "Lọc nhanh"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setFilters({ ...filters, dateFrom: today, dateTo: today });
                      }}
                      className="cursor-pointer"
                    >
                      Hôm nay
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const dateStr = yesterday.toISOString().split('T')[0];
                        setFilters({ ...filters, dateFrom: dateStr, dateTo: dateStr });
                      }}
                      className="cursor-pointer"
                    >
                      Hôm qua
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const today = new Date();
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        setFilters({
                          ...filters,
                          dateFrom: weekAgo.toISOString().split('T')[0],
                          dateTo: today.toISOString().split('T')[0]
                        });
                      }}
                      className="cursor-pointer"
                    >
                      7 ngày qua
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const today = new Date();
                        const monthAgo = new Date(today);
                        monthAgo.setDate(monthAgo.getDate() - 30);
                        setFilters({
                          ...filters,
                          dateFrom: monthAgo.toISOString().split('T')[0],
                          dateTo: today.toISOString().split('T')[0]
                        });
                      }}
                      className="cursor-pointer"
                    >
                      30 ngày qua
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilters({ ...filters, dateFrom: undefined, dateTo: undefined })}
                      className="cursor-pointer text-red-600"
                    >
                      Xóa bộ lọc
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[140px] justify-between shrink-0">
                      {filters.status
                        ? PROCESS_STAGES.find((s) => s.status === filters.status)?.label
                        : "Tất cả trạng thái"}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => setFilters({ ...filters, status: undefined })}
                      className="cursor-pointer"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${!filters.status ? "opacity-100" : "opacity-0"}`}
                      />
                      Tất cả trạng thái
                    </DropdownMenuItem>
                    {PROCESS_STAGES.map((stage) => (
                      <DropdownMenuItem
                        key={stage.status}
                        onClick={() => setFilters({ ...filters, status: stage.status })}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            filters.status === stage.status ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {stage.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant={filters.myOrders ? "default" : "outline"}
                  onClick={() => setFilters({ ...filters, myOrders: !filters.myOrders })}
                  size="sm"
                  className="shrink-0"
                >
                  <User className="h-4 w-4 mr-2" />
                  Đơn của tôi
                </Button>
            </div>
          </div>
        </div>

        {/* Kanban Board - Desktop only, hidden on mobile */}
        <div className="flex-1 overflow-hidden hidden md:block relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Left scroll button */}
              {showLeftArrow && (
                <button
                  onClick={() => scrollKanban('left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
              )}

              {/* Right scroll button */}
              {showRightArrow && (
                <button
                  onClick={() => scrollKanban('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              )}

              <div
                ref={kanbanScrollRef}
                className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-4 h-full"
                onScroll={checkScrollButtons}
              >
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
            </>
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
                      onClick={() => setFilters({ ...filters, status: isActive ? undefined : stage.status })}
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
                    ? (ordersByStatus[filters.status as OrderStatus] || [])
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
          onSuccess={() => {
            // No need to fetch orders - WebSocket will handle realtime updates
            console.log('✅ Order created - WebSocket will update the list automatically');
          }}
        />

        {/* Transition Confirmation Dialog */}
        {pendingTransition && (
          <ConfirmTransitionDialog
            open={showTransitionDialog}
            onOpenChange={setShowTransitionDialog}
            order={pendingTransition.order}
            fromStatus={pendingTransition.order.status as OrderStatus}
            toStatus={pendingTransition.newStatus}
            onConfirm={handleConfirmTransition}
          />
        )}
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
