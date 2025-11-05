"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { orderApi } from "@/lib/api";
import { Order, OrderStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Calendar, Search, TrendingUp, CheckCircle, XCircle, Package } from "lucide-react";

type TabType = "stats" | "completed" | "cancelled";

function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await orderApi.getOrders({ search: "", myOrders: false });
      setOrders(response.items);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;

    // Filter by tab
    if (activeTab === "completed") {
      filtered = filtered.filter((order) => order.status === OrderStatus.COMPLETED);
    } else if (activeTab === "cancelled") {
      filtered = filtered.filter((order) => order.status === OrderStatus.FAILED);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer_phone.includes(searchQuery)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, activeTab, searchQuery]);

  const handleOrderClick = (order: Order) => {
    // TODO: Implement order details dialog
    console.log("Order clicked:", order);
  };

  // Statistics calculations
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
  const cancelledOrders = orders.filter((o) => o.status === OrderStatus.FAILED).length;
  const activeOrders = orders.filter(
    (o) => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.FAILED
  ).length;

  const totalRevenue = orders
    .filter((o) => o.status === OrderStatus.COMPLETED)
    .reduce((sum, order) => {
      const itemsTotal = (order.items || []).reduce(
        (itemSum, item) => itemSum + item.quantity * item.price,
        0
      );
      const shippingFee = typeof order.shipping_fee === 'string' ? parseFloat(order.shipping_fee) : order.shipping_fee;
      return sum + itemsTotal + (shippingFee || 0);
    }, 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "đ";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; className: string }> = {
      [OrderStatus.CREATED]: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800" },
      [OrderStatus.WEIGHING]: { label: "Cân hàng", className: "bg-blue-100 text-blue-800" },
      [OrderStatus.CREATE_INVOICE]: { label: "Tạo hóa đơn", className: "bg-purple-100 text-purple-800" },
      [OrderStatus.SEND_PHOTO]: { label: "Gửi ảnh", className: "bg-indigo-100 text-indigo-800" },
      [OrderStatus.PAYMENT]: { label: "Thanh toán", className: "bg-orange-100 text-orange-800" },
      [OrderStatus.IN_KITCHEN]: { label: "Vào bếp", className: "bg-pink-100 text-pink-800" },
      [OrderStatus.PROCESSING]: { label: "Đang xử lý", className: "bg-cyan-100 text-cyan-800" },
      [OrderStatus.DELIVERY]: { label: "Đang giao", className: "bg-amber-100 text-amber-800" },
      [OrderStatus.COMPLETED]: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
      [OrderStatus.FAILED]: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
    };

    const { label, className } = statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
              <p className="text-sm text-gray-600">Xem tổng quan và chi tiết đơn hàng</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "stats"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Thống kê</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "completed"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Đơn hoàn thành ({completedOrders})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "cancelled"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                <span>Đơn đã hủy ({cancelledOrders})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "stats" ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                      <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Đơn hoàn thành</p>
                      <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Đơn đã hủy</p>
                      <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Đơn đang xử lý</p>
                      <p className="text-2xl font-bold text-orange-600">{activeOrders}</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Tổng doanh thu</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
                    <p className="text-sm text-blue-100 mt-1">
                      Từ {completedOrders} đơn hoàn thành
                    </p>
                  </div>
                  <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo mã đơn, tên hoặc số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Orders List */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">Không có đơn hàng nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{order.order_number}</p>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-600">{order.customer_name}</p>
                          <p className="text-sm text-gray-500">{order.customer_phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(
                              (order.items || []).reduce((sum, item) => sum + item.quantity * item.price, 0) +
                                (typeof order.shipping_fee === 'string' ? parseFloat(order.shipping_fee) : order.shipping_fee || 0)
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3">
                        <div className="space-y-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {item.product_name} x {item.quantity} {item.unit}
                              </span>
                              <span className="text-gray-900 font-medium">
                                {formatCurrency(item.quantity * item.price)}
                              </span>
                            </div>
                          ))}
                          {((typeof order.shipping_fee === 'string' ? parseFloat(order.shipping_fee) : order.shipping_fee || 0) > 0) && (
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Phí ship</span>
                              <span>{formatCurrency(typeof order.shipping_fee === 'string' ? parseFloat(order.shipping_fee) : order.shipping_fee || 0)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Reports() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ReportsPage />
      </AppLayout>
    </ProtectedRoute>
  );
}
